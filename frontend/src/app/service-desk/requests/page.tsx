'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { serviceRequestsAPI } from '@/lib/api';
import { formatDateShort } from '@/lib/utils';

export default function ServiceRequestsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['service-requests'],
    queryFn: () => serviceRequestsAPI.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="p-8">Loading...</div>;
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      URGENT: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      TRIAGED: 'bg-indigo-100 text-indigo-800',
      ASSIGNED: 'bg-purple-100 text-purple-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Desk</h1>
            <p className="text-sm text-gray-600">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Role: {user.roles?.join(', ')}
            </span>
            <button
              onClick={() => logout()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Service Requests</h2>
          <button
            onClick={() => router.push('/service-desk/requests/new')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            + Create Request
          </button>
        </div>

        {isLoading && <div className="text-center py-8">Loading requests...</div>}
        
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-md">
            Error loading requests. Please try again.
          </div>
        )}

        {data?.data && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SR Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.serviceRequests?.map((sr: any) => (
                  <tr key={sr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {sr.srNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sr.title}
                      {(sr.isResponseOverdue || sr.isResolveOverdue) && (
                        <span className="ml-2 text-xs text-red-600 font-semibold">⚠ OVERDUE</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(sr.priority)}`}>
                        {sr.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sr.status)}`}>
                        {sr.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sr.building?.name} - {sr.room?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDateShort(sr.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => router.push(`/service-desk/requests/${sr.id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {data.data.serviceRequests?.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No service requests found. Create your first one!
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
