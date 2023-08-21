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

    // Try to find the data record using the combination of line_id and userId
    const existingData = await prisma.geometry.findMany({
      where: {
        userId: user.id,
      },
    });

    if (existingData) {
      // If the record exists, it is stored in the existingData variable
      // console.log("Existing data:", existingData);
      return NextResponse.json(existingData);
    } else {
      console.log("Data not found for the given combination.");
      return NextResponse.json({
        error: "Data not found for the given combination.",
      });
    }
  } catch (error) {
    console.error("Error adding new line:", error);
    return NextResponse.json({ error: error });
  }
}
