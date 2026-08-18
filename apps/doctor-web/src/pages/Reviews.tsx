import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Star, MessageSquare, Reply, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Review {
  id: string;
  rating: number;
  comment: string;
  reply: string | null;
  createdAt: string;
  patient: {
    name: string;
  };
}

interface Stats {
  averageRating: string;
  totalReviews: number;
}

export function Reviews() {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({ averageRating: '0.0', totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchReviews();
    } else if (profile === null) {
      setLoading(false);
    }
  }, [profile]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/doctors/${profile?.id}/reviews`);
      setReviews(res.data.reviews);
      setStats(res.data.stats);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
      setLoading(false);
    }
  };

  const handleReplySubmit = async (reviewId: string) => {
    if (!replyText.trim()) return;
    
    setSubmitting(true);
    try {
      await api.patch(`/doctors/reviews/${reviewId}/reply`, { reply: replyText });
      setReplyText('');
      setReplyingTo(null);
      await fetchReviews();
    } catch (err) {
      console.error('Failed to submit reply', err);
      alert('Failed to submit reply');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'fill-orange-400 text-orange-400' : 'fill-gray-200 text-gray-200'}
      />
    ));
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Patient Feedback</h1>
        <p className="text-gray-500 mt-2">Manage your reviews and respond to patients.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-8 mb-8">
        <div className="text-center">
          <h2 className="text-5xl font-black text-gray-900">{stats.averageRating}</h2>
          <div className="flex justify-center gap-1 my-2">
            {renderStars(Math.round(parseFloat(stats.averageRating)))}
          </div>
          <p className="text-sm text-gray-500 font-medium">{stats.totalReviews} total reviews</p>
        </div>
        <div className="flex-1 space-y-3">
          {/* Mock distribution bars for aesthetics */}
          {[5, 4, 3, 2, 1].map(star => {
            const isTop = star === 5;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600 w-3">{star}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${isTop ? 'bg-orange-400' : 'bg-gray-300'}`} 
                    style={{ width: isTop ? '80%' : star === 4 ? '15%' : '5%' }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No reviews yet</h3>
            <p className="text-gray-500 mt-1">When patients leave feedback, it will appear here.</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-700">
                    <User size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{review.patient.name}</h4>
                    <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {renderStars(review.rating)}
                </div>
              </div>
              
              <p className="text-gray-700 leading-relaxed mb-6">{review.comment}</p>

              {review.reply ? (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 ml-8 relative">
                  <div className="absolute -left-3 top-6 w-3 h-px bg-gray-300"></div>
                  <div className="absolute -left-3 top-0 w-px h-6 bg-gray-300"></div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-teal-600 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">Your Reply</div>
                    <span className="text-xs text-gray-500">Public response</span>
                  </div>
                  <p className="text-sm text-gray-700">{review.reply}</p>
                </div>
              ) : replyingTo === review.id ? (
                <div className="ml-8 mt-4 animate-in fade-in slide-in-from-top-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a public reply to this patient..."
                    className="w-full border-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 text-sm p-3 min-h-[100px]"
                  ></textarea>
                  <div className="flex justify-end gap-2 mt-3">
                    <button 
                      onClick={() => { setReplyingTo(null); setReplyText(''); }}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleReplySubmit(review.id)}
                      disabled={submitting || !replyText.trim()}
                      className="px-4 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Posting...' : 'Post Reply'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ml-8 mt-2">
                  <button 
                    onClick={() => setReplyingTo(review.id)}
                    className="flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    <Reply size={16} /> Write a public reply
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
