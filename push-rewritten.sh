# git clone git@github.com:pdffiller/jsfiller3.git
# git clone git@github.com:pdffiller/jsfcore.git
# git clone git@github.com:pdffiller/ws-editor-lib.git
# git clone git@github.com:pdffiller/snfiller.git

# sh ~/makeMonoRepository/remote-\>local.sh

# better in 4 windows
# git filter-branch -f --tree-filter '~/makeMonoRepository/mv-package.sh jsfcore' -- --all
# git filter-branch -f --tree-filter '~/makeMonoRepository/mv-package.sh ws-editor-lib' -- --all
# git filter-branch -f --tree-filter '~/makeMonoRepository/mv-project.sh snfiller' -- --all
# git filter-branch -f --tree-filter '~/makeMonoRepository/mv-project.sh jsfiller3' -- --all

cd ~/rewritten/jsfcore
git remote add origin git@github.com:isachivka/rewritten-jsfcore.git
git push --all

cd ../jsfiller3
git remote add origin git@github.com:isachivka/rewritten-jsfiller3.git
git push --all

cd ../ws-editor-lib
git remote add origin git@github.com:isachivka/rewritten-ws-editor-lib.git
git push --all

cd ../snfiller
git remote add origin git@github.com:isachivka/rewritten-snfiller.git
git push --all
