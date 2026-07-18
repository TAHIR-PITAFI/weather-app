import { NextResponse } from 'next/server';
import { prisma } from '@database/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const requests = await prisma.weatherRequest.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { location, resolvedName, lat, lon, weatherPayload, startDate, endDate } = body;

    if (lat === undefined || lon === undefined || !weatherPayload) {
      return NextResponse.json({ error: 'Missing required fields: lat, lon, weatherPayload' }, { status: 400 });
    }

    // Validate date range if provided
    if (startDate && endDate) {
      const s = new Date(startDate), e = new Date(endDate);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      if (s > e) {
        return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
      }
    }

    const record = await prisma.weatherRequest.create({
      data: {
        locationQuery: location || "Unknown",
        resolvedLocationName: resolvedName || location || "Unknown",
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        temperatureData: JSON.stringify(weatherPayload),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      }
    });

    return NextResponse.json(record);
  } catch (error: any) {
    console.error("POST API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
