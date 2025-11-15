'use client'

import { useState, useEffect } from 'react'

interface Props {
  value?: { good: number; neutral: number; bad: number }
  onChange: (value: { good: number; neutral: number; bad: number }) => void
}

export function SentimentSpreadField({ value, onChange }: Props) {
  const [good, setGood] = useState(value?.good || 60)
  const [neutral, setNeutral] = useState(value?.neutral || 25)
  const [bad, setBad] = useState(value?.bad || 15)
  const [error, setError] = useState('')

  const total = good + neutral + bad

  useEffect(() => {
    if (total === 100) {
      setError('')
    } else {
      setError(`Total: ${total}% (must equal 100%)`)
    }
  }, [total])

  const handleSubmit = () => {
    if (total === 100) {
      onChange({ good, neutral, bad })
    }
  }

  const isValid = total === 100

  return (
    <div className="card animate-slide-in">
      <label className="block text-lg font-semibold text-gray-800 mb-3">
        3. Review Sentiment Distribution
      </label>
      <p className="text-sm text-gray-600 mb-4">
        How should the sentiment be distributed across reviews? (Total must equal 100%)
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Positive Reviews: {good}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={good}
            onChange={(e) => setGood(parseInt(e.target.value))}
            className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Neutral Reviews: {neutral}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={neutral}
            onChange={(e) => setNeutral(parseInt(e.target.value))}
            className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Negative Reviews: {bad}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={bad}
            onChange={(e) => setBad(parseInt(e.target.value))}
            className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
        </div>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Total:</span>
          <span
            className={`text-lg font-bold ${
              isValid ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {total}%
          </span>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isValid}
        className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  )
}
