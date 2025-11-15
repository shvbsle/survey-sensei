import { NextRequest, NextResponse } from 'next/server'
import { ProductData } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Simple regex-based scraper (no external dependencies)
function extractWithRegex(html: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      // Decode HTML entities
      return match[1]
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim()
    }
  }
  return ''
}

function extractPrice(html: string): number | undefined {
  const patterns = [
    // JSON-LD structured data
    /\"price\":\"?\$?([\d,]+\.?\d*)\"?/,
    // Amazon price classes
    /class="a-price-whole">(\d+)/,
    /<span[^>]*class="[^"]*a-price-whole[^"]*">(\d+)</,
    // Price symbols
    /\$[\s]*([\d,]+\.?\d*)/,
    /<span[^>]*price[^>]*>[\s]*\$?([\d,]+\.?\d*)/i,
    // Specific Amazon price containers
    /<span[^>]*priceblock[^>]*>[\s]*\$?([\d,]+\.?\d*)/i,
    /id="priceblock_ourprice"[^>]*>[\s]*\$?([\d,]+\.?\d*)/,
    /id="priceblock_dealprice"[^>]*>[\s]*\$?([\d,]+\.?\d*)/,
    // Additional patterns for different Amazon layouts
    /"displayPrice":"?\$?([\d,]+\.?\d*)\"?/,
    /"listPrice":"?\$?([\d,]+\.?\d*)\"?/,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const price = parseFloat(match[1].replace(/,/g, ''))
      if (!isNaN(price) && price > 0) {
        return price
      }
    }
  }
  return undefined
}

function extractImages(html: string): string[] {
  const imageSet = new Set<string>()

  // Various image URL patterns
  const patterns = [
    // High-res images
    /"hiRes":"([^"]+)"/g,
    /"large":"([^"]+)"/g,
    /data-old-hires="([^"]+)"/g,
    // Main product images
    /src="(https:\/\/[^"]*images[^"]*amazon[^"]*\.jpg[^"]*)"/g,
    /src="(https:\/\/[^"]*m\.media-amazon[^"]*\.jpg[^"]*)"/g,
    // Alternative image patterns
    /"mainUrl":"([^"]+\.jpg[^"]*)"/g,
    /"thumb":"([^"]+\.jpg[^"]*)"/g,
    // Image gallery patterns
    /data-a-dynamic-image="[^"]*?https:?\\?\/\\?\/([^"\\]+\.jpg)/g,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      if (match[1] && match[1].startsWith('http') && !match[1].includes('transparent-pixel') && !match[1].includes('spinner')) {
        // Clean up escaped URLs
        const cleanUrl = match[1].replace(/\\/g, '')
        imageSet.add(cleanUrl)
      }
    }
  }

  return Array.from(imageSet).slice(0, 5)
}

function extractRating(html: string): number | undefined {
  const patterns = [
    /(\d+\.?\d*)\s*out of\s*5/i,
    /"ratingValue":"?(\d+\.?\d*)"?/,
    /star-rating[^>]*>(\d+\.?\d*)/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const rating = parseFloat(match[1])
      if (!isNaN(rating) && rating >= 0 && rating <= 5) {
        return rating
      }
    }
  }
  return undefined
}

function extractReviewCount(html: string): number | undefined {
  const patterns = [
    /([\d,]+)\s*ratings/i,
    /([\d,]+)\s*reviews/i,
    /"reviewCount":"?([\d,]+)"?/,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const count = parseInt(match[1].replace(/,/g, ''))
      if (!isNaN(count) && count > 0) {
        return count
      }
    }
  }
  return undefined
}

// Helper function to extract ASIN from any Amazon URL format
// Handles: /dp/, /gp/product/, /ASIN/, query parameters, shortened links, etc.
function extractASIN(url: string): string | null {
  const patterns = [
    // Standard product pages
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/ASIN\/([A-Z0-9]{10})/i,
    // URLs with query parameters (e.g., ?th=1&psc=1)
    /\/dp\/([A-Z0-9]{10})[?&]/i,
    /\/gp\/product\/([A-Z0-9]{10})[?&]/i,
    // Product detail pages with extra path segments
    /\/([A-Z0-9]{10})\/ref=/i,
    // ASIN in query parameters
    /[?&]asin=([A-Z0-9]{10})/i,
    // Shortened amzn.to links (ASIN at end)
    /amzn\.to\/([A-Z0-9]{10})/i,
    // ASIN at end of path (common in various formats)
    /\/([A-Z0-9]{10})$/i,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      // Validate ASIN format (10 alphanumeric characters)
      const asin = match[1].toUpperCase()
      if (/^[A-Z0-9]{10}$/.test(asin)) {
        return asin
      }
    }
  }

  return null
}

async function scrapeProduct(url: string, shouldFetchReviews: boolean = false): Promise<ProductData> {
  try {
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
    const platform = 'amazon'

    // Try RapidAPI first if configured (permanent free tier)
    if (RAPIDAPI_KEY && RAPIDAPI_KEY.trim() !== '') {
      console.log('🚀 Using RapidAPI for reliable Amazon data')

      const asin = extractASIN(url)
      if (!asin) {
        throw new Error('Could not extract ASIN from URL. Make sure the URL contains a valid Amazon product ID.')
      }

      console.log(`📦 Extracted ASIN: ${asin} from URL`)

      try {
        // OPTIMIZATION: Fetch both product details AND reviews in parallel (single API consumption)
        console.log('🔄 Fetching product details and reviews in parallel...')

        const [productResponse, reviewsResponse] = await Promise.all([
          // Fetch product details
          fetch(
            `https://real-time-amazon-data.p.rapidapi.com/product-details?asin=${asin}&country=US`,
            {
              headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
              }
            }
          ),
          // Always fetch reviews (we'll decide later whether to use them)
          fetch(
            `https://real-time-amazon-data.p.rapidapi.com/product-reviews?asin=${asin}&country=US&page=1&sort_by=TOP_REVIEWS&star_rating=ALL&verified_purchases_only=false&images_or_videos_only=false&current_format_only=false`,
            {
              headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com'
              }
            }
          )
        ])

        if (!productResponse.ok) {
          throw new Error(`RapidAPI product error: ${productResponse.status}`)
        }

        const productData = await productResponse.json()

        // Parse reviews (will be included regardless, frontend decides whether to show)
        let reviews: any[] = []
        try {
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json()
            if (reviewsData.data?.reviews) {
              // Map reviews to our format (limit to top 5)
              reviews = reviewsData.data.reviews.slice(0, 5).map((review: any) => ({
                author: review.review_author || 'Anonymous',
                rating: review.review_star_rating ? parseFloat(review.review_star_rating) : 0,
                title: review.review_title || '',
                text: review.review_comment || '',
                date: review.review_date || '',
                verified: review.is_verified_purchase || false,
              }))
              console.log(`✅ Fetched ${reviews.length} reviews from RapidAPI in parallel`)
            }
          }
        } catch (reviewError) {
          console.warn('⚠️  Could not parse reviews, continuing without them')
        }

        // Parse RapidAPI response
        if (productData.data) {
          const product = productData.data
          console.log('✅ Successfully fetched from RapidAPI')

          return {
            url: product.product_url || url,
            title: product.product_title || 'Unknown Product',
            price: product.product_price ? parseFloat(product.product_price.replace(/[^0-9.]/g, '')) : undefined,
            images: product.product_photos || [],
            description: product.product_description || product.product_title || '',
            brand: product.brand || undefined,
            rating: product.product_star_rating ? parseFloat(product.product_star_rating) : undefined,
            reviewCount: product.product_num_ratings || undefined,
            reviews,
            platform,
          }
        }
      } catch (apiError: any) {
        console.warn('⚠️  RapidAPI failed, falling back to direct scraping:', apiError.message)
        // Fall through to direct scraping
      }
    }

    // Fallback to direct scraping
    console.log('⚠️  RapidAPI not configured or failed, using direct scraping (may be blocked)')
    const scrapingMethod = RAPIDAPI_KEY && RAPIDAPI_KEY.trim() !== '' ? 'Direct (RapidAPI fallback)' : 'Direct'

    // Add random delay to appear more human-like
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))

    const response = await fetch(url, {
      headers: {
        // More realistic browser headers
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        // Amazon-specific headers that real browsers send
        'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()

    // Validate Amazon URL
    const hostname = new URL(url).hostname.toLowerCase()
    if (!hostname.includes('amazon')) {
      throw new Error('Only Amazon product URLs are supported')
    }

    // Extract title
    const titlePatterns = [
      /<span id="productTitle"[^>]*>([^<]+)<\/span>/,
      /<h1[^>]*productTitle[^>]*>([^<]+)<\/h1>/,
      /<title>([^<]+)<\/title>/,
      /"name":"([^"]+)"/,
    ]
    const title = extractWithRegex(html, titlePatterns) || 'Product Title Not Found'

    // Extract brand
    const brandPatterns = [
      /<a[^>]*id="bylineInfo"[^>]*>([^<]+)<\/a>/,
      /"brand":"([^"]+)"/,
      /<span[^>]*brand[^>]*>([^<]+)<\/span>/i,
    ]
    const brand = extractWithRegex(html, brandPatterns) || undefined

    // Extract description
    const descPatterns = [
      /<div[^>]*id="feature-bullets"[^>]*>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/,
      /<div[^>]*productDescription[^>]*>([^<]{50,500})/,
      /"description":"([^"]{50,500})"/,
    ]
    let description = extractWithRegex(html, descPatterns)

    // Clean up description
    if (description) {
      description = description
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500)
    }

    if (!description || description.length < 20) {
      description = `${title} - Product available on amazon`
    }

    const price = extractPrice(html)
    const images = extractImages(html)
    const rating = extractRating(html)
    const reviewCount = extractReviewCount(html)

    // Log extraction results for debugging
    console.log(`✅ Scraping successful (${scrapingMethod}):`, {
      titleFound: !!title && title !== 'Product Title Not Found',
      priceFound: !!price,
      imagesFound: images.length,
      brandFound: !!brand,
      ratingFound: !!rating,
      reviewCountFound: !!reviewCount
    })

    // Check if Amazon is blocking us (CAPTCHA or empty response)
    const isBlocked = html.includes('api-services-support@amazon.com') ||
                      html.includes('To discuss automated access to Amazon data') ||
                      html.length < 5000 // Very short response indicates blocking

    // If we couldn't extract the title, provide informative mock data
    if (!title || title === 'Product Title Not Found' || isBlocked) {
      console.warn('Amazon appears to be blocking the scraper. Providing mock data for demo purposes.')

      // Extract ASIN from URL for product identification
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/)
      const asin = asinMatch ? asinMatch[1] : 'SAMPLE'

      return {
        url,
        title: `Amazon Product ${asin}`,
        price: 99.99,
        images: ['https://via.placeholder.com/500x500?text=Amazon+Product'],
        description: `This is a sample product from Amazon (ASIN: ${asin}). Real scraping was blocked by Amazon's anti-bot protection. The demo will continue with mock data.`,
        brand: 'Sample Brand',
        rating: 4.5,
        reviewCount: 150,
        reviews: [],
        platform: 'amazon',
      }
    }

    // Return whatever we managed to extract (partial data is okay)
    return {
      url,
      title: title.substring(0, 200),
      price: price || undefined, // undefined if not found
      images: images.length > 0 ? images : ['https://via.placeholder.com/300x300?text=Product+Image'],
      description,
      brand: brand || undefined, // undefined if not found
      rating: rating || undefined, // undefined if not found
      reviewCount: reviewCount || undefined, // undefined if not found
      reviews: [],
      platform: 'amazon',
    }
  } catch (error: any) {
    console.error('Scrape error:', error)
    throw new Error(`Failed to scrape product: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, fetchReviews = false, mock = false } = body

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Product URL is required' },
        { status: 400 }
      )
    }

    // Check if URL ends with "mock" (case-insensitive) or mock parameter is true
    const urlLower = url.toLowerCase().trim()
    const isMockMode = mock || urlLower.endsWith('/mock') || urlLower.endsWith('mock') || urlLower === 'mock'

    // If mock mode detected, return consistent mock data immediately
    if (isMockMode) {
      console.log('🎭 Mock mode detected (URL ends with "mock") - returning test data')
      return NextResponse.json({
        success: true,
        data: {
          url: 'https://www.amazon.com/dp/MOCKTEST01',
          title: 'Mock Test Product - Premium Wireless Headphones with Noise Cancellation',
          price: 149.99,
          images: [
            'https://via.placeholder.com/600x600/4F46E5/FFFFFF?text=Mock+Product+1',
            'https://via.placeholder.com/600x600/7C3AED/FFFFFF?text=Mock+Product+2',
            'https://via.placeholder.com/600x600/EC4899/FFFFFF?text=Mock+Product+3'
          ],
          description: 'This is mock test data for development and testing purposes. Premium quality wireless headphones with active noise cancellation, 30-hour battery life, and comfortable over-ear design. Perfect for testing the Survey Sensei application without making real API calls.',
          brand: 'MockBrand Electronics',
          rating: 4.5,
          reviewCount: 1247,
          reviews: [
            {
              author: 'Test User 1',
              rating: 5,
              title: 'Excellent product!',
              text: 'These headphones exceeded my expectations. Great sound quality and comfortable for long listening sessions.',
              date: '2024-01-15',
              verified: true
            },
            {
              author: 'Test User 2',
              rating: 4,
              title: 'Very good, minor issues',
              text: 'Good headphones overall. Noise cancellation works well. Battery life is as advertised.',
              date: '2024-01-10',
              verified: true
            },
            {
              author: 'Test User 3',
              rating: 5,
              title: 'Best purchase this year',
              text: 'Amazing sound quality and build. Worth every penny!',
              date: '2024-01-05',
              verified: true
            }
          ],
          platform: 'amazon'
        }
      })
    }

    // Validate Amazon URL (only for real requests)
    try {
      const parsed = new URL(url)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol')
      }
      if (!parsed.hostname.toLowerCase().includes('amazon')) {
        return NextResponse.json(
          { success: false, error: 'Only Amazon product URLs are supported. Please use amazon.com URLs.' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const productData = await scrapeProduct(url, fetchReviews)

    return NextResponse.json({
      success: true,
      data: productData,
    })
  } catch (error: any) {
    console.error('Scrape error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to scrape product. The website may be blocking scrapers. Try a different product URL.'
      },
      { status: 500 }
    )
  }
}
