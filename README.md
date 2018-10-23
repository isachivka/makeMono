### Шаги:

Для примера работаем в папке `~/rewritten`

#### Выгрузить репозитории и все remote ветки

`./rewriteHistory.sh`

Внутри нужно заменить ссылки на репозитории

#### Переписать историю

В каждом репозитории в отдельном окне терминала запустить 

```sh
git filter-branch -f --tree-filter '~/makeMono/mv-package.sh PACKAGE_NAME' -- --all
```

или

```sh
git filter-branch -f --tree-filter '~/makeMono/mv-project.sh PROJECT_NAME' -- --all
```

- mv-package - для переноса /src/* -> /packages/NAME/*
- mv-project - для переноса /src/* -> /packages/NAME/src/*

#### Удалить оригинвльный ремоут и добавить другие

Создаем новые репозитории 

Запускаем `./afterRewrite.sh` заменяя пути и url'ы репозиториев

#### Создаем монорепозиторий и добавляем в его ремоуты с переписанной историей с помощью

`addOrigin.sh`

#### Все остальное делает `index.js`

Но для примера мержится только develop:
```
/**
 * Указываем целевой бранч и собранный нами объект с ветками:
 */
await octopusMerge({ branch: 'develop', branches: groupppedBranchesObject.develop });
```

Чтобы смержить все, нужно запустить этот код в цикле
