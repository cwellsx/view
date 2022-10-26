import { Request, Response } from 'express';
import * as path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { isHttpStatus, routeOnGet } from 'server';
import { AppRoutes } from 'ui-react';

import { nullApi } from './nullApi';

export function getHtml(req: Request, res: Response) {
  // get from the database
  const url = req.url;
  const userId = 1; // FIXME
  const result = routeOnGet(url, userId);
  if (isHttpStatus(result)) {
    res.sendStatus(result.httpStatus);
    return;
  }
  const cache = result[0];
  const context = {};
  const html: string = ReactDOMServer.renderToString(
    <StaticRouter location={req.url} context={context}>
      <AppRoutes api={nullApi} cache={cache} />
    </StaticRouter>
  );
  res.sendFile(path.join(__dirname, "build", "index.html"));
}
