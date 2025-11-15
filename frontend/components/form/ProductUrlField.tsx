'use client'

import { useState } from 'react'
import { ProductData } from '@/lib/types'
import { isValidUrl } from '@/lib/utils'
import Image from 'next/image'

interface Props {
  value: string
  onChange: (url: string) => void
  onComplete: (productData: ProductData) => void
  productData?: ProductData
}

export function ProductUrlField({ value, onChange, onComplete, productData }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleFetch = async () => {
    if (!isValidUrl(value)) {
      setError('Please enter a valid http(s) URL')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        onComplete(result.data)
      } else {
        setError(result.error || "Couldn't fetch that product. Try a different URL.")
      }
    } catch (err: any) {
      setError("Couldn't fetch that product. Try a different URL.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setError('')
    handleFetch()
  }

  return (
    <div className="card animate-fade-in">
      <label className="block text-lg font-semibold text-gray-800 mb-3">
        1. Amazon Product URL
      </label>
      <p className="text-sm text-gray-600 mb-4">
        Enter any Amazon product URL (e.g., amazon.com/dp/ASIN)
      </p>

      <div className="flex gap-2 mb-2">
        <input
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setError('')
          }}
          placeholder="https://www.amazon.com/dp/B0DCJ5NMV2"
          className="input flex-1"
          disabled={!!productData || isLoading}
        />
        {!productData && (
          <button
            onClick={handleFetch}
            disabled={!value || isLoading}
            className="btn-primary min-w-[100px]"
            title={!value ? "Enter a URL first" : "Click to fetch product"}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              'Fetch'
            )}
          </button>
        )}
      </div>

      {!productData && !error && (
        <p className="text-xs text-gray-500 mb-3">
          {!value ? '👆 Paste a product URL above, then click Fetch' : '✓ Ready! Click the Fetch button →'}
        </p>
      )}

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm mb-2">{error}</p>
          <button onClick={handleRetry} className="btn-secondary text-sm">
            Retry
          </button>
        </div>
      )}

      {productData && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-slide-in">
          <h4 className="font-semibold text-green-900 mb-3">Product Preview</h4>
          <div className="flex gap-4">
            {productData.images[0] && (
              <div className="w-24 h-24 relative flex-shrink-0 bg-white rounded-lg overflow-hidden border">
                <Image
                  src={productData.images[0]}
                  alt={productData.title}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="flex-1">
              <h5 className="font-medium text-gray-900 mb-1 line-clamp-2">
                {productData.title}
              </h5>
              {productData.price && (
                <p className="text-lg font-bold text-green-700 mb-1">
                  ${productData.price.toFixed(2)}
                </p>
              )}
              {productData.brand && (
                <p className="text-sm text-gray-600 mb-1">Brand: {productData.brand}</p>
              )}
              {productData.rating && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-yellow-600">★ {productData.rating.toFixed(1)}</span>
                  {productData.reviewCount && (
                    <span className="text-gray-500">({productData.reviewCount} reviews)</span>
                  )}
                </div>
              )}
            </div>
          </div>
          {productData.description && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-3">
              {productData.description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
