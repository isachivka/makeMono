mkdir packages
mkdir ./packages/$1
mv `ls -A | grep -v .git | grep -v packages` ./packages/$1
mv .gitignore ./packages/$1
