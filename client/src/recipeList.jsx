/*import React from 'react';

export function RecipeList({ recipes }) {
  return (
    <div>
      {recipes.map((recipe, index) => (
        <div key={index} className="recipe-card">
          <div className="card-head">
            {/* Вывод изображения (если есть) *///}
            /*{recipe.recipe_image && (
              <img src={recipe.recipe_image} alt={recipe.recipe_name} />
            )}
            <div className="card-head-text">
              <h2>{recipe.recipe_name}</h2>
              <p>{recipe.recipe_description}</p>

              {/* Вывод калорий, углеводов, жиров, белков *//*}
              <div className="nutrition">
                <span>Калории: {recipe.calories}</span>
                <span>Углеводы: {recipe.carbohydrate}</span>
                <span>Жиры: {recipe.fat}</span>
                <span>Белки: {recipe.protein}</span>
              </div>
            </div>
          </div>
          {/* Вывод ингредиентов *//*}
          <h3>Ингредиенты:</h3>
          <ul>
            {recipe.ingredients.map((ingredient, i) => (
              <li key={i}>{ingredient}</li>
            ))}
          </ul>

          {/* Вывод инструкции *//*}
          <h3>Инструкция:</h3>
          <ol>
            {recipe.directions.map((direction, i) => (
              <li key={i}>{direction}</li>
            ))}
          </ol>

          
        </div>
      ))}
    </div>
  );
}*/

import React from 'react';

export function RecipeList({ recipes }) {
  return (
    <div className="recipe-list">
      {recipes.map((recipe, index) => (
        <div key={index} className="recipe-card">
          <div className="card-image">
            {recipe.recipe_image && (
              <img src={recipe.recipe_image} alt={recipe.recipe_name} />
            )}
          </div>
          <div className="card-content">
            <h2>{recipe.recipe_name}</h2>
            <p className="description">{recipe.recipe_description}</p>
            <div className="nutrition">
              <span>Калории: {recipe.calories}</span>
              <span>Углеводы: {recipe.carbohydrate}</span>
              <span>Жиры: {recipe.fat}</span>
              <span>Белки: {recipe.protein}</span>
            </div>
            <h3>Ингредиенты:</h3>
            <ul>
              {recipe.ingredients.map((ingredient, i) => (
                <li key={i}>{ingredient}</li>
              ))}
            </ul>
            <h3>Инструкция:</h3>
            <ol>
              {recipe.directions.map((direction, i) => (
                <li key={i}>{direction}</li>
              ))}
            </ol>
          </div>
        </div>
      ))}
    </div>
  );
}
