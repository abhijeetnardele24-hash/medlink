import { eq } from 'drizzle-orm'; import { encounters } from './src/db/schema'; const id: string = '123'; eq(encounters.id, id);
