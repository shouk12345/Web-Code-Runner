import {Hono} from 'hono';
import type {Language} from '../schema.js';

const LANGUAGE_LABELS : Record<Language, string> = {
    node : 'Node.js',
    python : 'Python',
    cpp : 'C++',
};

const ENABLED_LANGUAGES = ['node', 'python'] as const;

const languageRoute = new Hono();

languageRoute.get('/', (c) => 
    c.json(ENABLED_LANGUAGES.map((id) => ({id, label: LANGUAGE_LABELS[id]})))
);

export {languageRoute};