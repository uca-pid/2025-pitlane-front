import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://korven-api-56885c34702b.herokuapp.com/external/products', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.warn(`Korven API unavailable: ${response.status}`);
      return NextResponse.json([], {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
      });
    }

    const products = await response.json();

    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.warn('Korven API unavailable:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json([], {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  }
}
