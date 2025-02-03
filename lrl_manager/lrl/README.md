# Repository for the LRL-Application to run in combination with a smartcontract on Ethereum.
You need to have pnpm installed on your machine. To install using npm run `sudo npm install pnpm@latest-10`

Run `docker compose build` and `docker compose up` to start Application.

Will start 3 containers:

- Dummycontract
- Frontend (Webinterface)
- Backend

To Interact with the application, go to `localhost:3000` in your browser.

To update the *Owned assets* view hit the **Reload** button. 

You can switch the *Owned assets* view to *All nodes* by clicking the table heading.

You can switch the *registerNode* interface to *registerAsset* by clicking the table heading.

## Typical program flow

1. register New Node
   repeat until enough Nodes registered (at least 3)
2. register new Asset
   App should automatically assign Inheritor (TOPSIS) and Executors (random)
3. *Optional*: Add more Inheritors
   App should check resource - requirements match
4. *Optional*: Add more Executors
5. Transfer Asset manually
