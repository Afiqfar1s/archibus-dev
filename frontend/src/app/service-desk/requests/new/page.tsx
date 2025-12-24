'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { serviceRequestsAPI, referenceAPI } from '@/lib/api';

export default function NewServiceRequestPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    siteId: '',
    buildingId: '',
    floorId: '',
    roomId: '',
    problemTypeId: '',
  });

  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: () => referenceAPI.getSites(),
    enabled: !!user,
  });

  const { data: buildings } = useQuery({
    queryKey: ['buildings', formData.siteId],
    queryFn: () => referenceAPI.getBuildings(parseInt(formData.siteId)),
    enabled: !!formData.siteId,
  });

  const { data: floors } = useQuery({
    queryKey: ['floors', formData.buildingId],
    queryFn: () => referenceAPI.getFloors(parseInt(formData.buildingId)),
    enabled: !!formData.buildingId,
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms', formData.floorId],
    queryFn: () => referenceAPI.getRooms(parseInt(formData.floorId)),
    enabled: !!formData.floorId,
  });

  const { data: problemTypes } = useQuery({
    queryKey: ['problemTypes'],
    queryFn: () => referenceAPI.getProblemTypes(),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: serviceRequestsAPI.create,
    onSuccess: (response) => {
      if (response.data?.serviceRequest) {
        router.push(`/service-desk/requests/${response.data.serviceRequest.id}`);
      }
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="p-8">Loading...</div>;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      priority: formData.priority as any,
      siteId: parseInt(formData.siteId),
      buildingId: parseInt(formData.buildingId),
      floorId: parseInt(formData.floorId),
      roomId: parseInt(formData.roomId),
      problemTypeId: parseInt(formData.problemTypeId),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Create Service Request</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Site *</label>
                <select
                  required
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value, buildingId: '', floorId: '', roomId: '' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select site...</option>
                  {sites?.data?.sites?.map((site: any) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Building *</label>
                <select
                  required
                  value={formData.buildingId}
                  onChange={(e) => setFormData({ ...formData, buildingId: e.target.value, floorId: '', roomId: '' })}
                  disabled={!formData.siteId}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">Select building...</option>
                  {buildings?.data?.buildings?.map((building: any) => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Floor *</label>
                <select
                  required
                  value={formData.floorId}
                  onChange={(e) => setFormData({ ...formData, floorId: e.target.value, roomId: '' })}
                  disabled={!formData.buildingId}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">Select floor...</option>
                  {floors?.data?.floors?.map((floor: any) => (
                    <option key={floor.id} value={floor.id}>{floor.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Room *</label>
                <select
                  required
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  disabled={!formData.floorId}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">Select room...</option>
                  {rooms?.data?.rooms?.map((room: any) => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Problem Type *</label>
              <select
                required
                value={formData.problemTypeId}
                onChange={(e) => setFormData({ ...formData, problemTypeId: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select problem type...</option>
                {problemTypes?.data?.problemTypes?.map((type: any) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            {createMutation.error && (
              <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
                Error creating request. Please try again.
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Service Request'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
