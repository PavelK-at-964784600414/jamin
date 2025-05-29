'use client';

import { CollaborationDisplayData } from '@/app/lib/definitions';
import AddLayerToCollabForm from './add-layer-form';

export default function AddLayerToCollabContent({ collaboration }: { collaboration: CollaborationDisplayData }) {
  return (
    <div className="w-full">
      <div className="mb-8 bg-gray-800 p-6 rounded-lg">
        <h1 className="text-2xl font-bold text-white mb-4">
          Add Layer to Collaboration
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Current Collaboration</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-200">
              <dt className="text-gray-400">Latest Layer:</dt>
              <dd>{collaboration.collab_title} ({collaboration.collab_instrument})</dd>
              <dt className="text-gray-400">Added by:</dt>
              <dd>{collaboration.collab_creator_name}</dd>
              <dt className="text-gray-400">Total Layers:</dt>
              <dd>{collaboration.total_layers_count}</dd>
              <dt className="text-gray-400">Participants:</dt>
              <dd>{collaboration.participants.length}</dd>
            </dl>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Original Theme</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-200">
              <dt className="text-gray-400">Title:</dt>
              <dd>{collaboration.parent_theme_title}</dd>
              <dt className="text-gray-400">Creator:</dt>
              <dd>{collaboration.parent_theme_creator_name}</dd>
              <dt className="text-gray-400">Created:</dt>
              <dd>{new Date(collaboration.parent_theme_date).toLocaleDateString()}</dd>
            </dl>
          </div>
        </div>

        {/* Show all layers in this collaboration */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">Layers in this Collaboration</h2>
          <div className="bg-gray-700 rounded-md p-4">
            <div className="space-y-3">
              {/* Original Theme */}
              <div className="flex items-center justify-between p-3 bg-gray-600 rounded-md">
                <div className="flex items-center">
                  {collaboration.parent_theme_creator_image_url && (
                    <img
                      src={collaboration.parent_theme_creator_image_url}
                      alt={collaboration.parent_theme_creator_name}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                  )}
                  <div>
                    <p className="text-yellow-400 font-medium">
                      {collaboration.parent_theme_title} (Original Theme)
                    </p>
                    <p className="text-xs text-gray-400">
                      by {collaboration.parent_theme_creator_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* All cumulative layers */}
              {collaboration.cumulative_layers?.map((layer, index) => (
                <div key={layer.layer_id} className="flex items-center justify-between p-3 bg-gray-600 rounded-md">
                  <div className="flex items-center">
                    {layer.layer_creator_image_url && (
                      <img
                        src={layer.layer_creator_image_url}
                        alt={layer.layer_creator_name}
                        className="w-8 h-8 rounded-full mr-3"
                      />
                    )}
                    <div>
                      <p className="text-sky-400 font-medium">
                        {layer.layer_title} ({layer.layer_instrument})
                      </p>
                      <p className="text-xs text-gray-400">
                        by {layer.layer_creator_name} • Layer {index + 1}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddLayerToCollabForm collaboration={collaboration} />
    </div>
  );
}
