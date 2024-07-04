/*import logo from './logo.svg';*/
import './App.css';
import React from 'react';
import { Form } from './form.jsx';
import { RecipeList } from './recipeList.jsx';

function App() {
  const [inputComboxbox, setInputCombobox] = React.useState([]);
  const [dataCombobox, setDataCombobox] = React.useState([]);
  const [inputMultiselect, setInputMultiselect] = React.useState([]);
  const [dataMultiselect, setDataMultiselect] = React.useState("");
  const [method, setMethod] = React.useState('ingredients');
  const [recipes, setRecipes] = React.useState([]);
  const [flag, setFlag] = React.useState(true);

  const changeDataCombobox = (value) => {
    setDataCombobox(value);
  }

  const changeDataMultiselect = (value) => {
    setDataMultiselect(value);
  }

  const loupeClick = () => {
    const menuBtn = document.querySelector('.loupe');
    const menu = document.querySelector('.menu');
    
    menu.classList.toggle("active");
    if (flag) {
      menuBtn.classList.remove("forward");
      menuBtn.classList.add("back");
    } else {
      menuBtn.classList.remove("back");
      menuBtn.classList.add("forward");
    }
    setFlag(!flag);
  }

  const clickBtn = (e) => {
      const menuBtn = document.querySelector('.loupe');
      const menu = document.querySelector('.menu');
      menu.classList.remove("active");
      menuBtn.classList.remove("back");
      menuBtn.classList.add("forward");
      setFlag(!flag);
      let body = {};
      e.preventDefault();
      if (method == "ingredients" && dataMultiselect == "") {
        alert("Введите ингредиенты!");
      } else if (method == "recipe" && dataCombobox == "") {
        alert("Введите рецепт!");
      }

      if (method == "ingredients") {
        let ingredients = dataMultiselect;
        body["ingredients"] = ingredients;
      } else {
        body["recipe"] = dataCombobox;
      }
      body["method"] = method;
      console.log(body);
      apiDataPost(body);
  }

  const changeMethod = (event) => {
    setMethod(event.target.value);
  }

  const apiDataPost = async (body) => {
    console.log("aaaa");
    const response = await fetch("http://localhost:443", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const data = await response.json();
    //setRecipes(data)
    console.log(data);
    if (data.length == 0) {
      alert("Рецептов не нашлось, попробуйте еще раз. Или выберете другой рецепт/ингредиенты");
    } else {
      if (data.message) {
        alert(data.message);
      } else {
        await setRecipes(data);
        await apiDataGet();
      }
    }
  }

  const apiDataGet = async () => {
    const response = await fetch("http://localhost:443", {
      method: "GET"
    })
    const data = await response.json();
    console.log(data.recipes)
    await setInputCombobox(data.recipes);
    await setInputMultiselect(data.ingredients);
  }
//<img src="./loupe.png"/>
React.useEffect(() => {
  apiDataGet();
}, [recipes])

  return (
    <>
      <div className="container">
        <header className="header">
          <div className="logo">I&R</div>
          <div onClick={loupeClick} className="loupe forward"></div>
        </header>
        <div className="menu">
          <Form
            onClickBtn={clickBtn}
            dataForCombobox={inputComboxbox}
            onChangeCombobox={changeDataCombobox}
            dataForMultiselect={inputMultiselect}
            onChangeMultiselect={changeDataMultiselect}
            onChangeMethod={changeMethod}
            method={method}
          />
        </div>
        <div>
          <RecipeList recipes={recipes} />
        </div>
      </div>
    </>
    )
}

export default App;
