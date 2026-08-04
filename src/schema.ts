import {z} from "zod";

const LanguageSchema = z.enum(['node', 'python', 'cpp']);

const TestCaseSchema = z.object({
    stdin: z.string().max(10_000),
    stdout: z.string().max(10_000),
});

const RunRequestSchema = z.object({
    code: z.string().max(20_000),
    cases: z.array(TestCaseSchema).min(1).max(200),
    language: LanguageSchema,
});

type RunRequest = z.infer<typeof RunRequestSchema>;
type Language = z.infer<typeof LanguageSchema>;
type TestCase = z.infer<typeof TestCaseSchema>;

export{RunRequestSchema, type RunRequest, type Language, type TestCase};