# Spec
## context
* `creeps: Array<Creep>`
* `rooms: Array<Room>`
* `constructionSites: Array<Array<ConstructionSite>>`

## memory
### creep
* `role: int`
    職業。`CHARGE`, `UP`, `BUILD`。
* `freeRole: boolean`
    `true` のとき作業中でなく、バランサーによってroleを変更されても問題ない
* `taste: int`
    ランダムな決定に用いる各creep固有の値。freeRoleになるときに変動させる。
