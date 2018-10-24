#!/bin/bash

git checkout -B local/$1 $1
bash ../mv.sh $2 > /dev/null
git add .
printf "commit moved $1 $2 $3"
git commit -m "Moved project to packages/* folder" > /dev/null
# git checkout master
# git checkout -b $3
# git checkout $3
# printf "merge $1 $3"
# git merge  --allow-unrelated-histories local/$1 -m "Merged local/$1 into $3"
# git merge HEAD &> /dev/null
# result=$?
# if [ $result -ne 0 ]
# then
#     git add .
#     git commit --no-edit
# fi

# git add .
# git merge --continue

# ws-editor-lib/develop ws-editor-lib develop
# jsfcore/develop jsfcore develop
# snfiller/develop snfiller develop
# jsfiller3/develop jsfiller3 develop

# develop
#  jsfiller3/develop snfiller/develop jsfcore/develop ws-editor-lib/develop


# git checkout -B local/snfiller/develop snfiller/develop
# bash ../mv.sh snfiller > /dev/null
# git add .
# printf "commit moved snfiller/develop snfiller develop"
# git commit -m "Moved project to packages/* folder" > /dev/null
# git checkout master
# git checkout -b develop
# git checkout develop
# printf "merge snfiller/develop develop"
# git merge  --allow-unrelated-histories --no-ff local/snfiller/develop -m "Merged local/snfiller/develop into develop" --no-edit
# git merge HEAD &> /dev/null
# result=$?
# if [ $result -ne 0 ]
# then
#     git add .
#     git commit --no-edit
# fi
