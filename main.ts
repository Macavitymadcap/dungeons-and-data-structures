import { serveDir } from '@std/http/file-server';
import { exists } from '@std/fs/exists';

Deno.serve(async (req) => {
    const rootPath = `${Deno.cwd()}/public`;
    const { pathname } = new URL(req.url);
    const method = req.method;
    
    const validPath = pathname === '/' || await exists(`${rootPath}${pathname}`);
    
    if (validPath && method === 'GET') {
        return serveDir(req, {
            fsRoot: rootPath,
        });
    }
    
    return new Response(`<div>404 - Not Found</div>`);
});
