import React from "react";
import { SearchInput } from "client/src";

/*
  This defines a throttled input control e.g. for a Search control.

  - "Throttled" means "no more than x per second"
  - "Debounced" means "after silence of x msec"

  I prefer a "throttled" UI -- a debounced UI seems laggy because continuous input (without silence) causes no updates.

  So the logic is:
  
  - When the user changes the input then the callback is invoked immediately
  - The callback can't be invoked again until the previous callback completes and some time passes
*/

// delay at least 100 msec between API calls
const throttleDelay = 100;

export function useThrottledInput(api: (input: SearchInput) => Promise<void>) {
  const [value, setValue] = React.useState("");
  const [handled, setHandled] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);

  const isRunning = React.useRef<boolean>(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value);

  function finished(handling: string): void {
    isRunning.current = false;
    setHandled(handling);
  }

  React.useEffect(() => {
    if (isRunning.current) {
      // already running ... don't run now, run again when current run has completed
      return;
    }
    // handle the current state
    const handling = value;
    if (handling === handled) {
      // nothing new to do
      return;
    }
    // remember we're running so this doesn't get reentered
    isRunning.current = true;
    // make the API call
    api({ searchInput: handling })
      .then(() => {
        // do nothing here -- data from the API call was already handled in the implementation of the newData function
      })
      .catch((reason) => {
        setErrorMessage(reason.message);
      })
      .finally(() => {
        // wait a bit (in order to "throttle") before allowing the next API call
        setTimeout(finished, throttleDelay, handling);
      });
  }, [value, handled, api]);

  return { value, setValue, errorMessage };
}
