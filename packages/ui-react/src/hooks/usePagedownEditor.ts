import React from "react";

export function usePagedownEditor() {
  const [once, setOnce] = React.useState<boolean>(false);

  // calling reload() will force a re-render, but if getPagedownEditor().run() is called
  // more than once then bad things happen e.g. there would be more than one editor toolbar

  // the original code embedded a <script> tag to run getPagedownEditor().run()
  // but if we do that then that will run before these React elements are rendered
  // so use the effect hook to specify somethng to be run after it's rendered
  React.useEffect(() => {
    // getPagedownEditor was added to the window object by the pagedown-editor/sample-bundle.js
    if (!once) {
      (window as any).getPagedownEditor().run();
      setOnce(true);
    }
  }, [once]);
}
