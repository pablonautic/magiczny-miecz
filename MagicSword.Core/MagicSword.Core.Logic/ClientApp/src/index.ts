﻿require('module-alias/register');

import { GameServer } from "./GameServer";

let app = new GameServer().getApp();
export { app };