import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

interface RequestBody {
  id: string;
  values?: any;
}

export async function POST(req: NextRequest) {
  //save data to db
  const body = await req.json();
  //insert with prisma data
  console.log("body==========>>>>>>", body);

  const token = await getToken({ req });
  console.log("token", token);

  const email = token?.email;
  if (!email) {
    throw new Error("User not found with the provided name.");
  }

  try {
    // Find the user by their name
    const user = await prisma.user.findUnique({
      where: { email: email }, // Assuming the name is unique for each user
    });

    if (!user) {
      console.error("User not found with the provided name.");
      throw new Error("User not found with the provided name.");
    }

    console.log("body", body);

    const newLineData = Object.entries(body.data).map((item: any) => {
      return {
        polygonId: item[0],
        userId: user.id,
        properties: JSON.stringify(item[1]) || "",
      } as any;
    });

    console.log("newLineData", newLineData);

    // Create an array of upsert operations for each new line
    const upsertOperations = newLineData.map((item: any) => {
      return prisma.geometry.upsert({
        where: {
          polygonId_userId: {
            polygonId: item.polygonId,
            userId: user.id,
          },
        },
        update: item, // Update with the new data
        create: {
          polygonId: item.polygonId,
          properties: item.properties,
          user: { connect: { id: user.id } }, // Connect the user relation using Prisma's connect syntax
        },
      });
    });

    // Execute the upsert operations
    await Promise.all(upsertOperations);

    // Execute all upsert operations in parallel
    const upsertResults = await Promise.all(upsertOperations);

    console.log("New line added:", upsertResults);
    return NextResponse.json({ upsertResults, saved: true });
  } catch (error) {
    console.error("Error adding new line:", error);
    return NextResponse.json({ error: error });
  }
}
