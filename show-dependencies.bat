rem GraphViz is on my machine but not on my PATH so specify its location here
set GRAPHVIZ=C:\Users\Christopher\Source\Repos\graphviz-2.38\release\bin
call madge-packages . -o .\packages\deps-all.png -g %GRAPHVIZ% -x unused
call madge-packages . -o .\packages\deps-shared.png -g %GRAPHVIZ% -x unused -i "client|server$|shared"
call madge-packages . -o .\packages\deps-ui.png -g %GRAPHVIZ% -x unused -i "^ui|client|shared" -h "^ui"
call madge-packages . -o .\packages\deps-mock.png -g %GRAPHVIZ% -x unused -i "^ui|client|mock|server$" -h "mock"
call madge-packages . -o .\packages\deps-server.png -g %GRAPHVIZ% -x unused -i "server$|server\-types$|server\-data$|prebuild|shared" -h "server\-|prebuild"
call %GRAPHVIZ%\dot .\packages\ui-react\dependencies.dot -Tpng -o.\packages\ui-react\dependencies.png
