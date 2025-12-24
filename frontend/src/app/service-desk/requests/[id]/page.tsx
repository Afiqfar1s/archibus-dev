'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { serviceRequestsAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function ServiceRequestDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { user, loading: authLoading, hasAnyRole } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [comment, setComment] = useState('');

  const id = parseInt(params.id as string);

  const { data: srData, isLoading } = useQuery({
    queryKey: ['service-request', id],
    queryFn: () => serviceRequestsAPI.get(id),
    enabled: !!user && !!id,
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => serviceRequestsAPI.getComments(id),
    enabled: !!user && !!id && activeTab === 'comments',
  });

  const { data: auditData } = useQuery({
    queryKey: ['audit', id],
    queryFn: () => serviceRequestsAPI.getAudit(id),
    enabled: !!user && !!id && activeTab === 'audit',
  });

  const submitMutation = useMutation({
    mutationFn: () => serviceRequestsAPI.submit(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-request', id] }),
  });

  const addCommentMutation = useMutation({
    mutationFn: (body: string) => serviceRequestsAPI.addComment(id, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      setComment('');
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  const sr = srData?.data?.serviceRequest;
  if (!sr) {
    return <div className="p-8">Service request not found</div>;
  }

  const canSubmit = sr.status === 'DRAFT' && sr.requestedByUserId === user.id;
  const canTriage = sr.status === 'SUBMITTED' && hasAnyRole(['SUPERVISOR', 'ADMIN']);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{sr.srNumber}</h1>
          <p className="text-sm text-gray-600">{sr.title}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-3 border-b-2 font-medium text-sm ${
                      activeTab === 'details'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`px-6 py-3 border-b-2 font-medium text-sm ${
                      activeTab === 'comments'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Comments
                  </button>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-6 py-3 border-b-2 font-medium text-sm ${
                      activeTab === 'audit'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Audit Trail
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Description</h3>
                      <p className="mt-1 text-sm text-gray-900">{sr.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Location</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {sr.site?.name} › {sr.building?.name} › {sr.floor?.name} › {sr.room?.name}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Problem Type</h3>
                        <p className="mt-1 text-sm text-gray-900">{sr.problemType?.name}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Requested By</h3>
                        <p className="mt-1 text-sm text-gray-900">{sr.requestedBy?.name}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Created</h3>
                        <p className="mt-1 text-sm text-gray-900">{formatDate(sr.createdAt)}</p>
                      </div>

                      {sr.assignedTechnician && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Assigned To</h3>
                          <p className="mt-1 text-sm text-gray-900">{sr.assignedTechnician.user.name}</p>
                        </div>
                      )}

                      {sr.responseDueAt && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Response Due</h3>
                          <p className={`mt-1 text-sm ${sr.isResponseOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                            {formatDate(sr.responseDueAt)}
                            {sr.isResponseOverdue && ' (OVERDUE)'}
                          </p>
                        </div>
                      )}

                      {sr.resolveDueAt && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Resolve Due</h3>
                          <p className={`mt-1 text-sm ${sr.isResolveOverdue ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                            {formatDate(sr.resolveDueAt)}
                            {sr.isResolveOverdue && ' (OVERDUE)'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="space-y-4">
                    <div>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <button
                        onClick={() => comment.trim() && addCommentMutation.mutate(comment)}
                        disabled={!comment.trim() || addCommentMutation.isPending}
                        className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {addCommentMutation.isPending ? 'Adding...' : 'Add Comment'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {commentsData?.data?.comments?.map((comment: any) => (
                        <div key={comment.id} className="p-4 bg-gray-50 rounded-md">
                          <div className="flex justify-between mb-2">
                            <span className="font-medium text-sm text-gray-900">{comment.user.name}</span>
                            <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.body}</p>
                        </div>
                      ))}
                      {commentsData?.data?.comments?.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'audit' && (
                  <div className="space-y-2">
                    {auditData?.data?.auditLogs?.map((log: any) => (
                      <div key={log.id} className="flex gap-3 text-sm">
                        <span className="text-gray-500">{formatDate(log.createdAt)}</span>
                        <span className="font-medium text-gray-900">{log.user.name}</span>
                        <span className="text-gray-700">{log.action}</span>
                        {log.fromStatus && log.toStatus && (
                          <span className="text-gray-600">
                            {log.fromStatus} → {log.toStatus}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Status</h3>
              <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                {sr.status}
              </span>
              <div className="mt-3">
                <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  {sr.priority}
                </span>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Actions</h3>
              <div className="space-y-2">
                {canSubmit && (
                  <button
                    onClick={() => submitMutation.mutate()}
                    disabled={submitMutation.isPending}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </button>
                )}
                {/* Add more action buttons based on status and role */}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
