import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from 'hono/jwt'
import { signupInput, signinInput } from "@ap21prakash/validate";

export const userRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        JWT_secret: string;
    }
}>();

userRouter.post('/signup', async (c) => {
    const body = await c.req.json();
    // console.log('Received body:', body);
    const { success } = signupInput.safeParse(body);
    // console.log(success);
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        })
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    try {
      console.log("Bye");
      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: body.password,
          name: body.name
        }
      })
      const jwt = await sign({
        id: user.id
      }, c.env.JWT_secret);
  
      return c.text(jwt)
    } catch(e) {
      // console.log(e);
      c.status(411);
      return c.text('Invalid')
    }
  })
  
  
  userRouter.post('/signin', async (c) => {
    const body = await c.req.json();
    const { success } = signinInput.safeParse(body);
    if (!success) {
        c.status(411);
        return c.json({
            message: "Inputs not correct"
        })
    }

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
  
    try {
      const user = await prisma.user.findFirst({
        where: {
          email: body.username,
          password: body.password,
        }
      })
      if (!user) {
        c.status(403);
        return c.json({
          message: "Incorrect creds"
        })
      }
      const jwt = await sign({
        id: user.id
      }, c.env.JWT_secret);
  
      return c.text(jwt)
    } catch(e) {
      console.log(e);
      c.status(411);
      return c.text('Invalid')
    }
  })