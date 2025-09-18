import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

// Validation schema
const uploadSchema = z.object({
    file: z.instanceof(File),
    grade: z.string().min(1, "Grade is required"),
    subject: z.string().min(1, "Subject is required"),
    medium: z.string().min(1, "Medium is required"),
});

// Configuration
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".mp4",
    ".avi",
    ".mov",
];

// Utility functions
const sanitizePath = (str: string): string => {
    return str.replace(/[^a-zA-Z0-9\s-]/g, "").trim().replace(/\s+/g, "_");
};

const getFileExtension = (filename: string): string => {
    return path.extname(filename).toLowerCase();
};

const isValidFileType = (filename: string): boolean => {
    const ext = getFileExtension(filename);
    return ALLOWED_EXTENSIONS.includes(ext);
};

const generateUniqueFileName = (originalName: string): string => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = getFileExtension(originalName);
    const baseName = path.basename(originalName, ext);
    const sanitizedBaseName = sanitizePath(baseName);

    return `${timestamp}_${randomStr}_${sanitizedBaseName}${ext}`;
};

const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
};

export async function POST(req: NextRequest) {
    try {
        // Parse the form data from the client
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const grade = formData.get("grade") as string | null;
        const subject = formData.get("subject") as string | null;
        const medium = formData.get("medium") as string | null;

        // Validate input
        if (!file || !grade || !subject || !medium) {
            return NextResponse.json(
                { success: false, error: "All fields are required" },
                { status: 400 }
            );
        }

        // Validate with the Zod schema
        const validation = uploadSchema.safeParse({ file, grade, subject, medium });
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Validation failed",
                    details: validation.error.issues,
                },
                { status: 400 }
            );
        }

        // Validate the file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
                },
                { status: 400 }
            );
        }

        // Validate the file type
        if (!isValidFileType(file.name)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(
                        ", "
                    )}`,
                },
                { status: 400 }
            );
        }

        // Sanitize the path components
        const sanitizedGrade = sanitizePath(grade);
        const sanitizedSubject = sanitizePath(subject);
        const sanitizedMedium = sanitizePath(medium);

        // Build the upload folder path
        const uploadDir = path.join(
            process.cwd(),
            "public",
            "uploads",
            sanitizedGrade,
            sanitizedSubject,
            sanitizedMedium
        );

        // Ensure the directory exists
        await ensureDirectoryExists(uploadDir);

        // Generate the unique filename
        const fileName = generateUniqueFileName(file.name);
        const filePath = path.join(uploadDir, fileName);

        // Convert the file to a buffer and save it
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(filePath, buffer);

        // Generate the relative path and URL for the file
        const relativePath = path
            .relative(path.join(process.cwd(), "public"), filePath)
            .replace(/\\/g, "/");
        const fileUrl = `/${relativePath}`;

        return NextResponse.json({
            success: true,
            fileUrl,
            relativePath,
            fileName,
            fileSize: file.size,
            message: "File uploaded successfully!",
        });
    } catch (error) {
        console.error("Upload error:", error);

        // Do not expose internal errors to the client
        return NextResponse.json(
            {
                success: false,
                error: "Internal server error occurred while uploading the file",
            },
            { status: 500 }
        );
    }
}
