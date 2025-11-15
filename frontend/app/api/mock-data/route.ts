import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { FormData, ProductData, MockDataSummary } from '@/lib/types'
import { getRandomName, getRandomCity, generateMockEmail, generateRandomAge, generateRandomZip, getGenderFromName } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function generateUUID(): string {
  return crypto.randomUUID()
}

// Generate mock embeddings (1536 dimensions for OpenAI ada-002 compatibility)
// In production, you would use OpenAI's embeddings API
function generateMockEmbedding(text: string): number[] {
  // Create a deterministic but pseudo-random embedding based on text
  const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const random = (n: number) => {
    const x = Math.sin(seed + n) * 10000
    return (x - Math.floor(x)) * 2 - 1 // Normalize to [-1, 1]
  }

  return Array.from({ length: 1536 }, (_, i) => random(i))
}

function generateMockProduct(baseProduct: ProductData, index: number, isSimilar: boolean): any {
  const variations = [
    'Pro', 'Plus', 'Elite', 'Premium', 'Standard', 'Basic', 'Advanced', 'Deluxe',
    'Ultra', 'Max', 'Mini', 'Lite', 'Studio', 'Air', 'Sport', 'Comfort'
  ]

  const titleVariation = isSimilar
    ? `${baseProduct.title} ${variations[index % variations.length]}`
    : `Alternative Product ${index + 1} - Amazon Item`

  const description = isSimilar ? baseProduct.description : `Alternative product description ${index + 1}`
  const brand = isSimilar ? baseProduct.brand : `Brand ${String.fromCharCode(65 + index)}`

  // Generate embedding from product title + description + brand
  const embeddingText = `${titleVariation} ${description} ${brand}`
  const embeddings = generateMockEmbedding(embeddingText)

  return {
    item_id: generateUUID(),
    title: titleVariation,
    description,
    brand,
    source_platform: 'amazon',
    product_url: baseProduct.url,
    pictures: baseProduct.images.slice(0, 3),
    tags: [baseProduct.brand, 'electronics', isSimilar ? 'similar' : 'alternative'].filter(Boolean),
    review_count: Math.floor(Math.random() * 500) + 10,
    embeddings: JSON.stringify(embeddings), // PostgreSQL vector type accepts array as JSON
  }
}

function generateMockUser(name?: string, email?: string, age?: number, location?: string, gender?: 'Male' | 'Female'): any {
  // If gender is provided, use it to generate appropriate name
  // If name is provided, derive gender from name
  // Otherwise, randomly select gender and generate matching name
  const userGender = gender || (name ? getGenderFromName(name) : (Math.random() > 0.5 ? 'Male' : 'Female'))
  const userName = name || getRandomName(userGender)
  const city = location ? { city: location.split(',')[0], state: location.split(',')[1]?.trim() || 'NY' } : getRandomCity()

  // Generate last_active timestamp (within last 30 days)
  const lastActive = new Date()
  lastActive.setDate(lastActive.getDate() - Math.floor(Math.random() * 30))

  const userAge = age || generateRandomAge(18, 70)
  const baseLocation = location || `${city.city}, ${city.state}`
  const creditScore = Math.floor(Math.random() * 301) + 500
  const avgMonthlyExpenses = Math.round(Math.random() * 5000 * 100) / 100

  // Generate embedding from user demographics profile
  const embeddingText = `${userName} ${userGender} age ${userAge} ${baseLocation} credit score ${creditScore} monthly expenses ${avgMonthlyExpenses}`
  const embeddings = generateMockEmbedding(embeddingText)

  return {
    user_id: generateUUID(),
    user_name: userName,
    email_id: email || generateMockEmail(userName),
    age: userAge,
    gender: userGender,
    base_location: baseLocation,
    base_zip: generateRandomZip(),
    credit_score: creditScore,
    avg_monthly_expenses: avgMonthlyExpenses,
    last_active: lastActive.toISOString(),
    embeddings: JSON.stringify(embeddings), // PostgreSQL vector type accepts array as JSON
  }
}

function generateMockTransaction(userId: string, productId: string, daysAgo: number): any {
  const orderDate = new Date()
  orderDate.setDate(orderDate.getDate() - daysAgo)

  // Expected delivery: 3-7 days after order
  const expectedDeliveryDate = new Date(orderDate)
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + Math.floor(Math.random() * 5) + 3)

  // Actual delivery: within expected window or slightly delayed
  const deliveryDate = new Date(orderDate)
  deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 7) + 1)

  const originalPrice = 50 + Math.random() * 300
  const retailPrice = Math.random() > 0.5 ? originalPrice * (0.8 + Math.random() * 0.15) : originalPrice

  const statuses = ['delivered', 'delivered', 'delivered', 'returned', 'in_transit']
  const status = statuses[Math.floor(Math.random() * statuses.length)]

  // Return date: only for returned items, 7-30 days after delivery
  let returnDate = null
  if (status === 'returned' && deliveryDate) {
    returnDate = new Date(deliveryDate)
    returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 24) + 7)
  }

  return {
    transaction_id: generateUUID(),
    item_id: productId,
    user_id: userId,
    order_date: orderDate.toISOString(),
    expected_delivery_date: expectedDeliveryDate.toISOString(),
    delivery_date: deliveryDate.toISOString(),
    return_date: returnDate ? returnDate.toISOString() : null,
    original_price: Math.round(originalPrice * 100) / 100,
    retail_price: Math.round(retailPrice * 100) / 100,
    transaction_status: status,
  }
}

function generateMockReview(
  userId: string,
  productId: string,
  transactionId: string,
  sentiment: 'good' | 'neutral' | 'bad',
  productTitle: string
): any {
  const goodReviews = [
    `Absolutely love this ${productTitle}! Exceeded my expectations in every way.`,
    `Great quality and works perfectly. Highly recommend this product!`,
    `Best purchase I've made this year. Worth every penny.`,
    `Outstanding performance and build quality. Very satisfied!`,
  ]

  const neutralReviews = [
    `It's okay, does what it's supposed to do but nothing special.`,
    `Average product for the price. Neither impressed nor disappointed.`,
    `Works fine, though I expected a bit more for what I paid.`,
    `Decent product, meets basic expectations but could be better.`,
  ]

  const badReviews = [
    `Disappointed with this purchase. Quality is not as advertised.`,
    `Had high hopes but this product didn't meet my expectations.`,
    `Overpriced for what you get. Not worth the money.`,
    `Poor quality and stopped working after a few weeks.`,
  ]

  const reviews = sentiment === 'good' ? goodReviews : sentiment === 'neutral' ? neutralReviews : badReviews
  const stars = sentiment === 'good' ? 4 + Math.floor(Math.random() * 2) : sentiment === 'neutral' ? 3 : 1 + Math.floor(Math.random() * 2)

  const timestamp = new Date()
  timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 60))

  const reviewTitle = `${stars} star review`
  const reviewText = reviews[Math.floor(Math.random() * reviews.length)]

  // Generate embedding from review title + text
  const embeddingText = `${reviewTitle} ${reviewText}`
  const embeddings = generateMockEmbedding(embeddingText)

  return {
    review_id: generateUUID(),
    item_id: productId,
    user_id: userId,
    transaction_id: transactionId,
    timestamp: timestamp.toISOString(),
    review_title: reviewTitle,
    review_text: reviewText,
    review_stars: stars,
    manual_or_agent_generated: 'manual',
    embeddings: JSON.stringify(embeddings), // PostgreSQL vector type accepts array as JSON
  }
}

async function generateAndInsertMockData(formData: FormData): Promise<MockDataSummary> {
  const summary: MockDataSummary = {
    products: 0,
    users: 0,
    transactions: 0,
    reviews: 0,
    scenario: '',
    coldStart: {
      product: formData.hasReviews === 'no' && formData.hasSimilarProductsReviewed === 'no',
      user: formData.userHasPurchasedSimilar === 'no',
    },
  }

  const allProducts: any[] = []
  const allUsers: any[] = []
  const allTransactions: any[] = []
  const allReviews: any[] = []

  // Insert the scraped product
  const mainProduct = {
    item_id: generateUUID(),
    title: formData.productData!.title,
    description: formData.productData!.description,
    brand: formData.productData!.brand,
    source_platform: 'amazon',
    product_url: formData.productData!.url,
    pictures: formData.productData!.images,
    tags: [formData.productData!.brand, 'amazon'].filter(Boolean),
    review_count: formData.productData!.reviewCount || 0,
  }
  allProducts.push(mainProduct)

  // Field 2 & 3: Product has reviews
  if (formData.hasReviews === 'yes' && formData.sentimentSpread) {
    const totalReviews = 20 + Math.floor(Math.random() * 30)
    const goodCount = Math.round((totalReviews * formData.sentimentSpread.good) / 100)
    const neutralCount = Math.round((totalReviews * formData.sentimentSpread.neutral) / 100)
    const badCount = totalReviews - goodCount - neutralCount

    // Generate users and reviews based on sentiment spread
    for (let i = 0; i < totalReviews; i++) {
      const user = generateMockUser()
      allUsers.push(user)

      const transaction = generateMockTransaction(user.user_id, mainProduct.item_id, Math.floor(Math.random() * 90) + 1)
      allTransactions.push(transaction)

      let sentiment: 'good' | 'neutral' | 'bad'
      if (i < goodCount) sentiment = 'good'
      else if (i < goodCount + neutralCount) sentiment = 'neutral'
      else sentiment = 'bad'

      const review = generateMockReview(user.user_id, mainProduct.item_id, transaction.transaction_id, sentiment, mainProduct.title)
      allReviews.push(review)
    }

    summary.scenario = `Product has ${totalReviews} reviews with ${formData.sentimentSpread.good}% positive, ${formData.sentimentSpread.neutral}% neutral, ${formData.sentimentSpread.bad}% negative sentiment.`
  }

  // Field 4: Similar products have reviews
  if (formData.hasReviews === 'no' && formData.hasSimilarProductsReviewed === 'yes') {
    const similarProductCount = 5 + Math.floor(Math.random() * 6) // 5-10
    const userCount = 50 + Math.floor(Math.random() * 51) // 50-100

    // Generate similar products
    for (let i = 0; i < similarProductCount; i++) {
      const product = generateMockProduct(formData.productData!, i, true)
      allProducts.push(product)
    }

    // Generate users, transactions, and reviews
    for (let i = 0; i < userCount; i++) {
      const user = generateMockUser()
      allUsers.push(user)

      // Each user purchases 1-3 random similar products
      const purchaseCount = 1 + Math.floor(Math.random() * 3)
      for (let j = 0; j < purchaseCount; j++) {
        const randomProduct = allProducts[1 + Math.floor(Math.random() * similarProductCount)]
        const transaction = generateMockTransaction(user.user_id, randomProduct.item_id, Math.floor(Math.random() * 180))
        allTransactions.push(transaction)

        // 50% chance of review
        if (Math.random() > 0.5 && transaction.transaction_status === 'delivered') {
          const sentiments: ('good' | 'neutral' | 'bad')[] = ['good', 'good', 'neutral', 'bad']
          const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)]
          const review = generateMockReview(user.user_id, randomProduct.item_id, transaction.transaction_id, sentiment, randomProduct.title)
          allReviews.push(review)
        }
      }
    }

    summary.scenario = `Similar products reviewed: ${similarProductCount} products, ${userCount} users, with organic transaction and review patterns.`
  }

  // Cold start scenario
  if (summary.coldStart.product) {
    summary.scenario = 'Cold start: No reviews for this product or similar products.'
  }

  // Field 6: User purchased similar products
  if (formData.userHasPurchasedSimilar === 'yes') {
    const userSimilarProducts = 8 + Math.floor(Math.random() * 8) // 8-15
    const userProducts: any[] = []

    for (let i = 0; i < userSimilarProducts; i++) {
      const product = generateMockProduct(formData.productData!, i + 100, i < 5)
      userProducts.push(product)
    }

    // Add these products if not already added
    const existingIds = new Set(allProducts.map(p => p.item_id))
    userProducts.forEach(p => {
      if (!existingIds.has(p.item_id)) {
        allProducts.push(p)
      }
    })

    // Create transactions for the main user
    const mainUserId = formData.userPersona!.email
    const mainUser = allUsers.find(u => u.email_id === mainUserId) || generateMockUser(
      formData.userPersona!.name,
      formData.userPersona!.email,
      formData.userPersona!.age,
      `${formData.userPersona!.city}, ${formData.userPersona!.state}`
    )

    if (!allUsers.find(u => u.user_id === mainUser.user_id)) {
      allUsers.push(mainUser)
    }

    // Create 2 transactions with similar products
    for (let i = 0; i < 2; i++) {
      const product = userProducts[Math.floor(Math.random() * Math.min(5, userProducts.length))]
      const transaction = generateMockTransaction(mainUser.user_id, product.item_id, Math.floor(Math.random() * 365))
      allTransactions.push(transaction)

      // Add review for some
      if (i === 0 || Math.random() > 0.5) {
        const sentiment: 'good' | 'neutral' | 'bad' = ['good', 'neutral', 'bad'][Math.floor(Math.random() * 3)] as any
        const review = generateMockReview(mainUser.user_id, product.item_id, transaction.transaction_id, sentiment, product.title)
        allReviews.push(review)
      }
    }
  }

  // Field 7: User purchased exact product before
  if (formData.userHasPurchasedExact === 'yes') {
    const mainUser = allUsers.find(u => u.email_id === formData.userPersona!.email)
    if (mainUser) {
      const transaction = generateMockTransaction(mainUser.user_id, mainProduct.item_id, 30 + Math.floor(Math.random() * 90))
      allTransactions.push(transaction)
    }
  }

  // Insert into Supabase using admin client (bypasses RLS)
  try {
    if (allProducts.length > 0) {
      const { error } = await supabaseAdmin.from('products').insert(allProducts)
      if (error) throw error
      summary.products = allProducts.length
    }

    if (allUsers.length > 0) {
      const { error } = await supabaseAdmin.from('users').insert(allUsers)
      if (error) throw error
      summary.users = allUsers.length
    }

    if (allTransactions.length > 0) {
      const { error } = await supabaseAdmin.from('transactions').insert(allTransactions)
      if (error) throw error
      summary.transactions = allTransactions.length
    }

    if (allReviews.length > 0) {
      const { error } = await supabaseAdmin.from('reviews').insert(allReviews)
      if (error) throw error
      summary.reviews = allReviews.length
    }
  } catch (error: any) {
    console.error('Database insertion error:', error)
    throw new Error(`Failed to insert mock data: ${error.message}`)
  }

  return summary
}

export async function POST(request: NextRequest) {
  try {
    const formData: FormData = await request.json()

    if (!formData.productData) {
      return NextResponse.json(
        { success: false, error: 'Product data is required' },
        { status: 400 }
      )
    }

    const summary = await generateAndInsertMockData(formData)

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error: any) {
    console.error('Mock data generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate mock data' },
      { status: 500 }
    )
  }
}
