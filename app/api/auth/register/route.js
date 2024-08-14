// app/api/auth/register/route.js
import { MongoClient } from 'mongodb';
import { hash } from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db('your-database-name');
}

// export async function POST(request) {
//   const { email, password } = await request.json();

//   const db = await connectToDatabase();
//   const existingUser = await db.collection('users').findOne({ email });

//   if (existingUser) {
//     return new Response(JSON.stringify({ message: 'User already exists' }), {
//       status: 409,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }

//   const hashedPassword = await hash(password, 12);

//   await db.collection('users').insertOne({
//     email,
//     password: hashedPassword,
//   });

//   return new Response(JSON.stringify({ message: 'User registered successfully' }), {
//     status: 201,
//     headers: { 'Content-Type': 'application/json' },
//   });
// }

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ message: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = await connectToDatabase();
    const existingUser = await db.collection('users').findOne({ email });

    if (existingUser) {
      return new Response(JSON.stringify({ message: 'User already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    //const hashedPassword = await hash(password, 12);

    await db.collection('users').insertOne({
      email,
      password: password,
    });

    return new Response(JSON.stringify({ message: 'User registered successfully' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Failed to register user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


export async function GET(request) {
  return new Response(JSON.stringify({ message: 'GET method not supported for this route' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}