import React, { useReducer } from "react";

export const defaultContext = {
  popup: null,
  setPopup: () => {},
};

export const Context = React.createContext(defaultContext);

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_POPUP":
      return {
        ...state,
        popup: action.payload,
      };

    default:
      return state;
  }
};

export const ContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, defaultContext);

  return (
    <Context.Provider
      value={{
        ...state,
        setPopup: (data) => {
          dispatch({ type: "SET_POPUP", payload: data });
          return data;
        },
      }}
    >
      {children}
    </Context.Provider>
  );
};
