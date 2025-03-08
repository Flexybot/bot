"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsageLimitAlert } from '@/components/billing/UsageLimitAlert';
import {
  FileText,
  Upload,
  Globe,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  Download,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/dashboard/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

// Sample document data
type Document = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  lastModified: string;
  status: 'processed' | 'processing' | 'failed';
};

const documents: Document[] = [
  {
    id: '1',
    name: 'product-manual.pdf',
    type: 'PDF',
    size: 2500000,
    uploadedBy: 'John Doe',
    lastModified: '2024-03-15T10:00:00',
    status: 'processed'
  },
  {
    id: '2',
    name: 'api-documentation.docx',
    type: 'DOCX',
    size: 1800000,
    uploadedBy: 'Jane Smith',
    lastModified: '2024-03-14T15:30:00',
    status: 'processed'
  },
  {
    id: '3',
    name: 'training-materials.pptx',
    type: 'PPTX',
    size: 5200000,
    uploadedBy: 'Mike Johnson',
    lastModified: '2024-03-13T09:15:00',
    status: 'processing'
  }
];

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState('documents');
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const columns: ColumnDef<Document>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{doc.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => {
        const size = row.getValue('size') as number;
        return <span>{(size / 1024 / 1024).toFixed(2)} MB</span>;
      },
    },
    {
      accessorKey: 'uploadedBy',
      header: 'Uploaded By',
    },
    {
      accessorKey: 'lastModified',
      header: 'Last Modified',
      cell: ({ row }) => {
        const date = new Date(row.getValue('lastModified') as string);
        return <span>{format(date, 'MMM d, yyyy')}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <div className="flex items-center">
            <div
              className={`h-2 w-2 rounded-full mr-2 ${
                status === 'processed'
                  ? 'bg-green-500'
                  : status === 'processing'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
            />
            <span className="capitalize">{status}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                <span>Download</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="mr-2 h-4 w-4" />
                <span>View</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 dark:text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
    }, 2000);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setIsUploading(true);
    // Simulate processing
    setTimeout(() => {
      setIsUploading(false);
      setUrlInput('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Knowledge Base</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      <UsageLimitAlert
        resourceType="documents"
        action="upload more documents"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="websites">Websites</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Upload PDF, Word, PowerPoint, or text files to train your chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOCX, PPTX, TXT (up to 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    multiple
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Library</CardTitle>
              <CardDescription>
                Manage your uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={documents}
                searchColumn="name"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="websites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Website Content</CardTitle>
              <CardDescription>
                Train your chatbot on website content by providing URLs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Website URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="url"
                      placeholder="https://example.com/docs"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                    <Button type="submit" disabled={isUploading}>
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>
                          <Globe className="mr-2 h-4 w-4" />
                          Add URL
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Website Sources</CardTitle>
              <CardDescription>
                Manage your website content sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">No websites added yet</h3>
                <p>Add website URLs above to start training your chatbot</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}