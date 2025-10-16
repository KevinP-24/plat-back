import { mock } from 'node:test';
import * as db from '../config/db.js';

// Reemplaza la función principal por un mock (promesa)
db.default = mock.fn(async () => []);
