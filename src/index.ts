import { Router } from '@stricjs/router';
import { fileTypeFromBuffer } from 'file-type';
import { existsSync } from 'fs';
import { parse, resolve } from 'path';

const UPLOADS = resolve('data/uploads')

const router: Router = new Router()
    .post('/upload', async (request) => {
        const data = await request.formData();
        const files = Array.from(data.values()).filter(isFile);

        if(files.length < 1) return new Response('No files provided', { status: 400 });
        if(files.length > 1) return new Response('Only one file allowed', { status: 400 });

        const file = files.at(0);
        if(isNullOrUndefined(file)) return new Response('No file provided', { status: 400 });

        const { name, base, ext } = parse(file.name);
        console.log(`Uploading ${base}...`);

        const filename = existsSync(resolve(UPLOADS, name)) ? `${name}-${random_letters()}${ext}` : base;

        Bun.write(resolve(UPLOADS, filename), await file.arrayBuffer());

        console.log(file.type);
    
        return Response.json({
            success: true,
            name: base,
            url: `/i/${base}`,
            fullURL: `http://${router.hostname}:${router.port}/i/${base}`,
        })
    })
    .get('/i/:name', async (request) => {
        if(!request.params.name) return new Response('No name provided', { status: 400 });
        if(!existsSync(resolve(UPLOADS, request.params.name))) return new Response('File not found', { status: 404 });

        const file = Bun.file(resolve(UPLOADS, request.params.name));
        const filetype = await fileTypeFromBuffer(await file.arrayBuffer());

        const res = new Response(file);
        res.headers.set('Content-Type', filetype?.mime ?? 'application/octet-stream');

        return res;
    });

export default router;

console.log(`Listening on http://${router.hostname}:${router.port}`);

const isFile = (input: unknown): input is File => input instanceof File;
const isNullOrUndefined = (value: unknown): value is null | undefined => value === undefined || value === null;
const random_letters = () => {
	return (Math.random() + 1).toString(36).substring(7);
}