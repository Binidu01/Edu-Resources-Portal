import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

// Validation schema
const deleteSchema = z.object({
    filePath: z.string().min(1, "File path is required"),
});

// Security: Ensure the file path is within the uploads directory
const isPathSafe = (filePath: string): boolean => {
    const publicDir = path.join(process.cwd(), "public");
    const absolutePath = path.resolve(publicDir, filePath);
    const uploadsDir = path.join(publicDir, "uploads");
    return absolutePath.startsWith(uploadsDir);
};

// Clean up empty directories going upward after a single file deletion
const cleanupEmptyDirectories = async (filePath: string): Promise<void> => {
    try {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        let currentDir = path.dirname(filePath);
        const normalizedUploadsDir = path.normalize(uploadsDir);

        while (currentDir.startsWith(normalizedUploadsDir) && currentDir !== normalizedUploadsDir) {
            try {
                const files = await fs.readdir(currentDir);
                if (files.length === 0) {
                    await fs.rm(currentDir, { recursive: true, force: true });
                    currentDir = path.dirname(currentDir);
                } else {
                    break;
                }
            } catch {
                break;
            }
        }
    } catch (error) {
        console.warn("Error during upward cleanup:", error);
    }
};

// Recursively delete all empty directories inside uploads
const cleanupAllEmptyDirs = async (baseDir: string): Promise<void> => {
    try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const subDir = path.join(baseDir, entry.name);
                await cleanupAllEmptyDirs(subDir);
            }
        }

        const remaining = await fs.readdir(baseDir);
        if (remaining.length === 0 && baseDir !== path.join(process.cwd(), "public", "uploads")) {
            await fs.rm(baseDir, { recursive: true, force: true });
        }
    } catch (err) {
        console.warn(`Skipping cleanup for ${baseDir}:`, err);
    }
};

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate input
        const validation = deleteSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid request data",
                    details: validation.error.issues,
                },
                { status: 400 }
            );
        }

        const { filePath } = validation.data;

        // Security check
        if (!isPathSafe(filePath)) {
            return NextResponse.json(
                { success: false, error: "Invalid file path" },
                { status: 400 }
            );
        }

        const absolutePath = path.join(process.cwd(), "public", filePath);

        try {
            const stats = await fs.stat(absolutePath);

            if (!stats.isFile()) {
                return NextResponse.json(
                    { success: false, error: "Path does not point to a file" },
                    { status: 400 }
                );
            }

            // Delete the file
            await fs.unlink(absolutePath);

            // Cleanup empty directories upward and full sweep
            await cleanupEmptyDirectories(absolutePath);
            const uploadsDir = path.join(process.cwd(), "public", "uploads");
            await cleanupAllEmptyDirs(uploadsDir);

            return NextResponse.json({
                success: true,
                message: "File deleted successfully and empty folders cleaned!",
                deletedPath: filePath,
            });
        } catch (error: unknown) {
            // Narrow the error safely
            if (error instanceof Error && "code" in error) {
                const errWithCode = error as NodeJS.ErrnoException;
                if (errWithCode.code === "ENOENT") {
                    return NextResponse.json(
                        { success: false, error: "File not found" },
                        { status: 404 }
                    );
                }
                if (errWithCode.code === "EACCES") {
                    return NextResponse.json(
                        { success: false, error: "Permission denied" },
                        { status: 403 }
                    );
                }
            }

            console.error("Unexpected file operation error:", error);
            return NextResponse.json(
                { success: false, error: "Unexpected error occurred" },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Delete error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Internal server error occurred while deleting file",
            },
            { status: 500 }
        );
    }
}
