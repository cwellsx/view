import { loginUser, routeOnGet, routeOnPost } from "server";
import { config } from "shared-lib";

// you could temporarily change this to enable logging, for debugging
const isLogging = false;

// this declares a subset of the fields we use from the DOM Response interface
export interface SimpleResponse {
  readonly ok: boolean;
  readonly statusText: string;
  json(): Promise<any>;
}

export function mockFetch(url: string, method: string, body: string): Promise<SimpleResponse> {
  return new Promise<SimpleResponse>((resolve, reject) => {
    setTimeout(() => {
      if (config.loginfails) {
        // simulate login failure
        const failPromise: Promise<any> = new Promise<any>((resolve, reject) => {
          // no possible need to call reject because we already have the data
          reject("Don't get JSON if request failed");
        });
        const failure: SimpleResponse = {
          ok: false,
          statusText: "Unauthorized",
          json: () => failPromise,
        };
        resolve(failure);
        return;
      }
      // a real server would infer the userId from authentication cookies
      // and not trust the client to pass its userId as an API parameter
      // but for the mock implementation we get and pass it from app context
      // const me: I.UserSummary | undefined = React.useContext(AppContext).me;
      // const userId: number | undefined = me ? me.idName.id : undefined;
      const userId = loginUser().id;
      const isPost: boolean = method === "POST";
      const json = !isPost ? routeOnGet(url, userId) : routeOnPost(url, userId, JSON.parse(body));
      if (!json) {
        // from inside setTimeout we must reject not throw
        // https://stackoverflow.com/questions/33445415/javascript-promises-reject-vs-throw
        reject(new Error(`No mock data found for ${url}`));
      }
      if (isLogging) {
        console.log(JSON.stringify(json, null, 2));
      }
      const jsonPromise: Promise<any> = new Promise<any>((resolve, reject) => {
        // no possible need to call reject because we already have the data
        resolve(json);
      });
      const response: SimpleResponse = {
        ok: true,
        statusText: "OK",
        json: () => jsonPromise,
      };
      resolve(response);
    }, config.mockdelay);
  });
}
