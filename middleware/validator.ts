import { z, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

export default function zValidator(schema: z.AnyZodObject) {
    return (req: Request<{}, {}, z.infer<typeof schema>>, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();

        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map((issue) => ({
                    message: `${issue.path.join('.')} is ${issue.message}`,
                }))
                res.status(400).json({ success: false, msg: errorMessages });
            }
            else {
                res.status(500).json({ success: false, msg: "Internal Server Error" });
            }
        }
    }
}