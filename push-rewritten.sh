# better in 4 windows
# git filter-branch -f --tree-filter '~/makeMono/mv-package.sh jsfcore' -- --all
# git filter-branch -f --tree-filter '~/makeMono/mv-package.sh ws-editor-lib' -- --all
# git filter-branch -f --tree-filter '~/makeMono/mv-project.sh snfiller' -- --all
# git filter-branch -f --tree-filter '~/makeMono/mv-project.sh jsfiller3' -- --all

cd ~/rewritten/jsfcore
git remote add origin git@github.com:isachivka/rewritten-jsfcore.git
git push --all

cd ~/rewritten/jsfiller3
git remote add origin git@github.com:isachivka/rewritten-jsfiller3.git
git push --all

cd ~/rewritten/ws-editor-lib
git remote add origin git@github.com:isachivka/rewritten-ws-editor-lib.git
git push --all

cd ~/rewritten/snfiller
git remote add origin git@github.com:isachivka/rewritten-snfiller.git
git push --all
