import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign,verify,decode} from 'hono/jwt'
export const blogRouter = new Hono<{
	Bindings: {
		DATABASE_URL: string
		JWT_secret:string
	},
    Variables: {
        userId:string;
    }
}>();
blogRouter.use('/*', async (c,next) => {
	const authHeader=c.req.header("authorization")||"";
    try{
        const user=await verify(authHeader,c.env.JWT_secret)
	    if (user && (user as { id: string }).id) {
            c.set('userId', (user as { id: string }).id);
            await next();
          }else{
		    c.status(403)
		    return c.json({
                message:"You are not logged in"
            })
	    }
    }catch(e){
        c.status(403);
        return c.json({
            message:"Some unexpected error occured"
        })
    }

});

blogRouter.get('/bulk',async(c)=>{
    const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate());
    const blogs = await prisma.blog.findMany({
        include: {
            author: {
                select: {
                    name: true,
                },
            },
        },
    });

    return c.json({
        blogs
    });

})

blogRouter.get('/:id', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate());

	const id= c.req.param("id");
    try{
        const blog = await prisma.blog.findFirst({
            where: {
                id: id,
            },
            include: {
                author: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        return c.json({
            blog
        })
    }catch(e){
        c.status(411);
        return c.json({
            message:"Error while fetching this post"
        });
    }
})

blogRouter.post('/',async (c) => {
    const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate());

	const body= await c.req.json();
    const authorId=c.get("userId");
    const blog= await prisma.blog.create({
        data:{
            title:body.title,
            content:body.content,
            authorId: authorId,

        }
    })

	return c.json({
        id:blog.id
    })
})

blogRouter.put('/', async (c) => {
    const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate());

	const body= await c.req.json();
    const blog= await prisma.blog.update({
        where:{
            id:body.id
        },
        data:{
            title:body.title,
            content:body.content,
        }

    })
    return c.json({
        id:blog.id
    })
	
})