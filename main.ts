import { serveDir } from '@std/http/file-server';
import { exists } from '@std/fs/exists';

const dir = Deno.args[0] || 'public';

Deno.serve(async (req) => {
    const rootPath = `${Deno.cwd()}/${dir}`;
    const { pathname } = new URL(req.url);
    const method = req.method;
    
    const fiePath = pathname === '/' ? '/index.html' : pathname;
    const validPath = pathname === '/' || await exists(`${rootPath}${fiePath}`);
    
    if (validPath && method === 'GET') {
        return serveDir(req, {
            fsRoot: rootPath,
            showDirListing: false,
        });
    }
    
    return new Response(`<div>404 - Not Found</div>`);
});
