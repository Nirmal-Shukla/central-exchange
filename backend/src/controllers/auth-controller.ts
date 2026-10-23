import bcrypt from "bcrypt"
import type { Request, Response } from "express";
import { prisma } from "../db";
import { authSchema } from "../types/authSchema"
import { sendValidationError } from "../utils/validation"
import { createToken } from "../utils/auth";


export async  function signup(req:Request,res:Response):Promise<void>{

  const validatedSchema = authSchema.safeParse(req.body)
console.log("before zod schema ")
  if(!validatedSchema.success){
    sendValidationError(res,validatedSchema.error)
    return
  }
console.log("after zod schema ")

 const{username,password} = validatedSchema.data
console.log("after validated schema data ")

 const hashedPassword = await bcrypt.hash(password,10)
console.log("before prisma user create   ")

 try{
    const user = await prisma.user.create({
      data:{
        username,
        password:hashedPassword
      }
    }) 
    console.log("after prisma user create   ")
    res.status(201).json({
      token:createToken({
        userId:user.id
      }),
      userId: user.id,
      username: user.username,
    })
    
 }

 catch {
    res.status(409).json({
      error: "username already exists",
    });
  }
}


export async function signin(req:Request,res:Response):Promise<void>{

const validatedSchema = authSchema.safeParse(req.body)

if(!validatedSchema.success){
  sendValidationError(res,validatedSchema.error)
  return
}

const{username,password} = validatedSchema.data

const userExists = await prisma.user.findFirst({
  where:{
  username
  }
})

if(!userExists){
res.status(401).json({
  Error:"username does not exists"

})
return
}
const correctPassword =  await bcrypt.compare(password,userExists.password)

if(!correctPassword){
  res.status(403).json({
    "message":"PASSWORD IS INCORRECT"
  })
  return
}

res.status(201).json({
  token :  createToken({userId:userExists.id}),
  userId:userExists.id,
  username:userExists.username
})


}