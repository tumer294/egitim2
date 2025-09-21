import { config } from 'dotenv';
config();

import '@/ai/flows/description-auto-fill.ts';
import '@/ai/flows/student-list-parser.ts';
import '@/ai/flows/speech-to-note.ts';
import '@/ai/flows/assistant-flow.ts';
import '@/ai/flows/individual-student-report-flow.ts';
import '@/ai/flows/class-report-flow.ts';
import '@/ai/flows/forum-assistant-flow.ts';
