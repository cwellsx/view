import 'normalize.css';

import { Api, getApi } from 'client/src';
import React from 'react';
import ReactDOM from 'react-dom';

import App from './App';
import * as serviceWorker from './serviceWorker';

// same as index-mock.ts except without server-mock
const api: Api = getApi();

ReactDOM.render(<App api={api} />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
