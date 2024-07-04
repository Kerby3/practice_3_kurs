const axios = require('axios');
const translate = require('node-google-translate-skidz');
const url_lib = require("url");
const crypto = require("crypto");
const querystring = require('querystring');
const https = require('https');

translate.engine = "deepl";
translate.key = process.env.DEEPL_KEY;

// Параметры запроса
const consumerKey = 'f24e9b57a0cf4cde9663ac9fbbf5584f';
const consumerSecret = 'efc3fe59577240969e070a128a1d524d';
const randomString = 'abc1';

let url = "https://platform.fatsecret.com/rest/server.api";

//конвертирует параметры из объекта в строку
function convertObjectToQueryString(obj) {
  return Object.keys(obj)
    .map((key) => `${key}=${obj[key]}`)
    .join('&');
}

//создает базовую строку
function createBaseString(url, params) {
  return `GET&${encodeURIComponent(url)}&${encodeURIComponent(params)}`;
}


//генерирует oauth_signature
function generateHMACSHA1Signature(baseString, consumerSecret, accessSecret="") {
  // Объединение секрета потребителя и секрета доступа с помощью '&'
  const signingKey = `${consumerSecret}&${accessSecret}`;

  // Создание хэша HMAC-SHA1
  const hmac = crypto.createHmac('sha1', signingKey);
  hmac.update(baseString);
  const hash = hmac.digest('base64');

  // Кодирование хэша с использованием процентов-кодирования RFC3986
  const encodedSignature = encodeURIComponent(hash);

  return encodedSignature;
}

function getInterval() {
  return interval = Math.floor(Date.now() / 1000);
}

//переводит текст
async function translateText(text, source, target) {
 return new Promise((resolve, reject) => {
  translate({
   text: text,
   source: source,
   target: target
  }, function(result) {
   resolve(result.translation);
  });
 })
}

async function translateRecipes(recipes, source = 'en', target = 'ru') {
  return Promise.all(recipes.map(async (recipe) => {
    const translatedRecipe = {};

    for (const key in recipe) {
      if (typeof recipe[key] === 'string') {
        translatedRecipe[key] = await translateText(recipe[key], source, target);
      } else if (Array.isArray(recipe[key])) {
        translatedRecipe[key] = await Promise.all(recipe[key].map(item => translateText(item, source, target)));
      } else {
        translatedRecipe[key] = recipe[key];
      }
    }

    return translatedRecipe;
  }));
}

//стандартные параметры
let default_params = {
  oauth_consumer_key : consumerKey,
  oauth_nonce : randomString,
  oauth_signature_method : "HMAC-SHA1",
  oauth_version : "1.0",
  format : "json"
}

//сортирует параметры
const sortParams = (params) => {
  let sortedParams = {};
  Object.keys(params).sort().forEach(key => {
    sortedParams[key] = params[key];
  });
  return sortedParams;
}

//подготавливает данные из запроса к виду, удобному для сохранения в базе
async function prepareDataToDB1(recipes) {
  const formattedRecipes = recipes.map(recipe => ({
    "recipe_description": recipe.recipe_description,
    "recipe_id": recipe.recipe_id,
    "recipe_image": recipe.recipe_image ? recipe.recipe_image : null,
    "recipe_name": recipe.recipe_name,
    "calories": recipe.recipe_nutrition.calories,
    "carbohydrate": recipe.recipe_nutrition.carbohydrate,
    "fat": recipe.recipe_nutrition.fat,
    "protein": recipe.recipe_nutrition.protein
  }));

  let ingredientsArrays = recipes.map(recipe => recipe.recipe_ingredients);
  ingredientsArrays = ingredientsArrays.map(recipe => recipe.ingredient);
  return [formattedRecipes, ingredientsArrays];
}

async function fetchDirections(url) {
  try {
    const res = await axios.get(url);
    if (!res.data || !res.data.recipe) {
      throw new Error('Не удалось получить инструкции');
    }
    return res.data.recipe; 
  } catch (error) {
    console.error("Ошибка при получении инструкций:", error);
    return null; 
  }
}

async function getDirections(ids) {
  const directionPromises = ids.map(async (id) => {
    let params = { ...default_params, "method": "recipe.get.v2", "oauth_timestamp": getInterval(), "recipe_id": id }; 
    let sortedParams = sortParams(params);
    let baseStr = createBaseString(url, convertObjectToQueryString(sortedParams));
    let oauth_signature = generateHMACSHA1Signature(baseStr, consumerSecret);
    let fullUrl = `${url}?${convertObjectToQueryString({ ...sortedParams, "oauth_signature": oauth_signature })}`;

    return fetchDirections(fullUrl); 
  });
  try {
    const allDirections = await Promise.all(directionPromises);
    if (allDirections.length == 0) {
      res.json({"message" : "Ошибка"});
      return;
    }
    const validDirections = allDirections.filter(direction => direction !== null); 
    return validDirections;
  } catch (error) {
    console.error("Ошибка при получении инструкций:", error);
    throw error; 
  }
}

function getDirectionDescriptions(nestedArray) {
  return nestedArray.map(innerArray => {
    return innerArray.map(item => item.direction_description);
  });
}

function combineData(fetchedId, directions, dataToDB1, dataToDB2) {
  /*console.log(fetchedId);
  console.log(dataToDB1);*/
  return dataToDB1.filter((item, index) => { 
    const recipeId = item.recipe_id;
    return fetchedId.includes(recipeId);
  }).map((item, index) => {
    const idIndex = fetchedId.indexOf(item.recipe_id);
    const newObject = { ...item };

    if (idIndex !== -1) {
      newObject.ingredients = dataToDB2[index];
      newObject.directions = directions[idIndex];
    }

    return newObject;
  });
}

async function addRecipesToDatabase(recipes, connection) {
  try {
    const [resultsOfIngredients] = await connection.execute('SELECT * FROM `ингредиенты`');
    const allIngredientsInBase = new Map(resultsOfIngredients.map(result => [result['название'], result['id-ингредиента']]));
    const [resultsOfRecipes] = await connection.execute('SELECT название FROM `рецепты`');
    const allRecipesInBase = new Set(resultsOfRecipes.map(result => result['название']));
    for (const recipe of recipes) {
      if (!allRecipesInBase.has(recipe.recipe_name)) {
        try {
          await connection.execute(
            'INSERT INTO рецепты (`id-рецепта`, название, описание, калории, углеводы, жиры, белки, последовательность, `ссылка-на-фото`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              parseInt(recipe.recipe_id),
              recipe.recipe_name,
              recipe.recipe_description,
              parseInt(recipe.calories),
              parseInt(recipe.carbohydrate),
              parseInt(recipe.fat),
              parseInt(recipe.protein),
              recipe.directions.join('\n'), 
              recipe.recipe_image
            ]
          );
          allRecipesInBase.add(recipe.recipe_name);
          for (const ingredientName of recipe.ingredients) {
            let ingredientId = allIngredientsInBase.get(ingredientName);
            if (!ingredientId) {
              try {
                const [result] = await connection.execute(
                  'INSERT INTO ингредиенты (`название`) VALUES (?)',
                  [ingredientName]
                );
                ingredientId = result.insertId;
                allIngredientsInBase.set(ingredientName, ingredientId);
              } catch (insertError) {
                console.error('Ошибка при добавлении ингредиента:', insertError);
              }
            }
            try {
              await connection.execute(
                'INSERT INTO `рецепт-ингредиенты` (`id-рецепта`, `id-ингредиента`) VALUES (?, ?)',
                [parseInt(recipe.recipe_id), ingredientId]
              );
              //console.log(`Связь добавлена: рецепт "${recipe.recipe_name}" - ингредиент "${ingredientName}" (${ingredientId})`);
            } catch (relationError) {
              console.error('Ошибка при добавлении связи рецепт-ингредиент:', relationError);
            }
          }
        } catch (insertError) {
          console.error('Ошибка при добавлении рецепта:', insertError);
        }
      }
    }
  } catch (error) {
    console.error('Произошла ошибка:', error);
  }
}

//обработка данных
const processData = async (req, res, pool, connection) => {
 //console.log(req.body);
 if (req.body['method'] == 'ingredients') {
     //console.log(req.body);
     let sql = `WITH RecipeIngredients AS (
    SELECT
        r.\`id-рецепта\`,
        r.\`название\` AS \`название_рецепта\`,
        r.\`описание\` AS \`описание_рецепта\`,
        r.\`калории\`,
        r.\`углеводы\`,
        r.\`жиры\`,
        r.\`белки\`,
        r.\`последовательность\`,
        r.\`ссылка-на-фото\`,
        GROUP_CONCAT(i.\`название\`) AS ингредиенты_рецепта
    FROM
        \`рецепты\` r
    JOIN
        \`рецепт-ингредиенты\` ri ON r.\`id-рецепта\` = ri.\`id-рецепта\`
    JOIN
        ингредиенты i ON ri.\`id-ингредиента\` = i.\`id-ингредиента\`
    GROUP BY
        r.\`id-рецепта\`
), 
AvailableIngredients AS (
    SELECT DISTINCT
        i.\`id-ингредиента\`
    FROM
        \`ингредиенты\` i
    WHERE
        i.\`название\` IN (`;
     for (let i = 0; i < req.body['ingredients'].length-1; i++) {
      sql += "?, "
     }
     sql += `?) -- Замените на список входящих ингредиентов
),
MissingIngredients AS (
  SELECT 
    ri.\`id-рецепта\`,
    COUNT(ri.\`id-ингредиента\`) AS количество_отсутствующих_ингредиентов
  FROM \`рецепт-ингредиенты\` ri
  LEFT JOIN AvailableIngredients ai ON ri.\`id-ингредиента\` = ai.\`id-ингредиента\`
  WHERE ai.\`id-ингредиента\` IS NULL
  GROUP BY ri.\`id-рецепта\`
)
SELECT 
    ri.название_рецепта as \`recipe_name\`,
    ri.описание_рецепта as \`recipe_description\`,
    ri.калории as \`calories\`,
    ri.углеводы as \`carbohydrate\`,
    ri.жиры as \`fat\`,
    ri.белки as \`protein\`,
    ri.последовательность as \`directions\`,
    ri.\`ссылка-на-фото\` as \`recipe_image\`,
    ri.ингредиенты_рецепта as \`ingredients\`
FROM 
    RecipeIngredients ri
LEFT JOIN 
    MissingIngredients mi ON ri.\`id-рецепта\` = mi.\`id-рецепта\`
WHERE 
    mi.\`id-рецепта\` IS NULL OR mi.количество_отсутствующих_ингредиентов = 0;`;
    try {
     let [suitableRecipes] = await pool.execute(sql, req.body['ingredients']);
     const recipeJson = suitableRecipes.map(recipe => {
      return {
        ...recipe,
        "ingredients" : recipe.ingredients.split(','),
        "directions" : recipe.directions.split('\n')
      }
     })
     res.json(recipeJson);
     return;
   } catch (error) {
      console.error("Ошибка при поиске рецептов:", error);
      res.status(500).json({ error: error.message });
      return;
   }
 } else if (req.body['method'] == 'recipe') {
  try {
    let [allRecipesInBase] = await connection.execute('SELECT `название` FROM `рецепты`');
    allRecipesInBase = allRecipesInBase.map(recipe => recipe['название']);
    
     if (allRecipesInBase.includes(req.body['recipe'])) {
      let [recipe] = await connection.execute('SELECT и.`название` as `ingredient`, р.`название` as `recipe_name`, р.`описание` as `recipe_description`, р.`калории` as `calories`, р.`углеводы` as `carbohydrate`, р.`жиры` as `fat`, р.`белки` as `protein`, р.`последовательность` as `directions`, р.`ссылка-на-фото` as `recipe_image` FROM `ингредиенты` и INNER JOIN `рецепт-ингредиенты` ри ON и.`id-ингредиента` = ри.`id-ингредиента` INNER JOIN `рецепты` р ON р.`id-рецепта` = ри.`id-рецепта` WHERE р.`название` = (?) ', [req.body['recipe']]);
      const recipeJson = recipe.reduce((acc, obj) => {
        acc.ingredients = acc.ingredients || [];
        acc.ingredients.push(obj.ingredient);
        delete obj.ingredient;
        obj.directions = obj.directions.split('\n');;
        Object.assign(acc, obj);
        return acc;
      }, {});
      res.json([recipeJson]);
      return;
     } else {
      let recipe = req.body['recipe'];
      translateText(recipe, 'ru', 'en')
      .then(translation => {
        let params = {...default_params, "method" : "recipes.search.v3", "oauth_timestamp" : getInterval(), "search_expression" : translation};
        //console.log(translation);
        let sortedParams = sortParams(params);
        let baseStr = createBaseString(url, convertObjectToQueryString(sortedParams));
        //console.log(`baseStr: ${baseStr}`);
        let oauth_signature = generateHMACSHA1Signature(baseStr, consumerSecret);
        axios.get(`${url}?${convertObjectToQueryString({...sortedParams, "oauth_signature" : oauth_signature})}`)
        .then(async function(response) {
          if (typeof response.data.recipes == "undefined") {
            res.json({"message" : "Ошибка"});
            return;
          }
          if (response.data.recipes.total_results == 0) {
            res.json({"message" : "Рецептов не нашлось"});
            return;
          }
          let recipes = response.data.recipes.recipe;
          let dataToDB = await prepareDataToDB1(recipes);
          const ids = dataToDB[0].map(recipe => recipe.recipe_id);
          await getDirections(ids)
          .then(async dirs => {
            let directions = [...dirs];
            let fetchedId = directions.map(dir => dir.recipe_id);
            directions = directions.map(dir => dir.directions.direction);
            directions = getDirectionDescriptions(directions);
            const result = combineData(fetchedId, directions, dataToDB[0], dataToDB[1]);
            translateRecipes(result)
            .then(async translatedRecipes => {
              //console.log(translatedRecipes);
              await addRecipesToDatabase(translatedRecipes, connection);
              res.json(translatedRecipes);
              return;
              
            });
          });
        })
      })

     }
 } catch (error) {
  console.log("Ошибка")
 }
}
}
const getData = async(req,res,connection) => {
  //const connection = await pool.getConnection();
  let [recipes] = await connection.execute('SELECT `название` FROM `рецепты`');
  let [ingredients] = await connection.execute('SELECT `название` FROM `ингредиенты`');
  recipes = recipes.map(recipe => recipe['название']);
  ingredients = ingredients.map(ingredient => ingredient['название']);
  let json = {"recipes" : recipes, "ingredients" : ingredients};
  res.json(json);
}
module.exports.processData = processData;
module.exports.getData = getData;