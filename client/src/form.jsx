/*import React from 'react';
import Combobox from "react-widgets/Combobox"
import Multiselect from "react-widgets/Multiselect"

export function Form( {onClickBtn, dataForCombobox, onChangeCombobox, dataForMultiselect, onChangeMultiselect, onChangeMethod, method} ) {
	return (
		<>
		<form className="form">

			<input
					type="radio"
					name="radio1"
					value="ingredients"
					checked={method === "ingredients"}
					className="radio1"
					onChange={onChangeMethod}
				></input>
				<label>Игредиенты</label>

			
				<input
					type="radio"
					name="radio2"
					value="recipe"
					checked={method === "recipe"}
					className="radio2"
					onChange={onChangeMethod}
				></input>
				<label>Рецепт</label>
			{method === "ingredients" ? 
			<Multiselect
				data={dataForMultiselect}
				onChange={onChangeMultiselect}
			>
			</Multiselect>
			:
			<Combobox
				data={dataForCombobox} // Пример данных для Combobox
				onChange={onChangeCombobox}
			>
			</Combobox>}
			<button onClick={onClickBtn}>Найти</button>
		</form>
		</>
	)
}*/ 

import React from 'react';
import Combobox from "react-widgets/Combobox"
import Multiselect from "react-widgets/Multiselect"

export function Form({ onClickBtn, dataForCombobox, onChangeCombobox, dataForMultiselect, onChangeMultiselect, onChangeMethod, method }) {
  return (
    <>
      <form className="form">
        <div className="form-group">
          <label htmlFor="method">Выбор:</label>
          <div className="radio-group">
            <input
              type="radio"
              name="method"
              value="ingredients"
              checked={method === "ingredients"}
              onChange={onChangeMethod}
            />
            <label htmlFor="ingredients">Ингредиенты</label>
          </div>
          <div className="radio-group">
            <input
              type="radio"
              name="method"
              value="recipe"
              checked={method === "recipe"}
              onChange={onChangeMethod}
            />
            <label htmlFor="recipe">Рецепт</label>
          </div>
        </div>

        <div className="form-group">
          {method === "ingredients" ? (
            <Multiselect
              data={dataForMultiselect}
              onChange={onChangeMultiselect}
              placeholder="Выберите ингредиенты"
            />
          ) : (
            <Combobox
              data={dataForCombobox}
              onChange={onChangeCombobox}
              placeholder="Введите рецепт"
            />
          )}
        </div>

        <button type="submit" onClick={onClickBtn}>
          Найти
        </button>
      </form>
    </>
  );
}
