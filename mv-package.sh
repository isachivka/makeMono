#!/bin/bash
mkdir ./packages || true
mkdir ./packages/$1 || true
mv ./src/* ./packages/$1 > /dev/null || true
mv `ls -A | grep -v .git | grep -v packages` ./packages/$1 || true
mv .gitignore ./packages/$1 || true
