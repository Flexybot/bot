"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganization } from '@/hooks/useOrganization';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon, CheckCircledIcon } from '@radix-ui/react-icons';
import { 
  Building2, 
  Globe, 
  Mail,
  Trash2,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export default function SettingsPage() {
  const { currentOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [organizationSettings, setOrganizationSettings] = useState({
    name: currentOrganization?.name || '',
    slug: currentOrganization?.slug || '',
    website: 'https://example.com',
    supportEmail: 'support@example.com'
  });

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Implement organization settings update
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSuccess('Organization settings updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update organization settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrganization = async () => {
    // Show confirmation dialog before proceeding
    if (!window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Implement organization deletion
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    } catch (err: any) {
      setError(err.message || 'Failed to delete organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your organization and account settings
        </p>
      </div>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Update your organization details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveOrganization} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
                    <CheckCircledIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="orgName"
                      value={organizationSettings.name}
                      onChange={(e) => setOrganizationSettings(prev => ({
                        ...prev,
                        name: e.target.value
                      }))}
                      placeholder="Your Organization Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgSlug">Organization URL</Label>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 flex items-center border rounded-md">
                      <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r">
                        flexybot.com/
                      </span>
                      <input
                        id="orgSlug"
                        className="flex-1 px-3 py-2 bg-transparent text-sm focus:outline-none"
                        value={organizationSettings.slug}
                        onChange={(e) => setOrganizationSettings(prev => ({
                          ...prev,
                          slug: e.target.value
                        }))}
                        placeholder="your-org"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      type="url"
                      value={organizationSettings.website}
                      onChange={(e) => setOrganizationSettings(prev => ({
                        ...prev,
                        website: e.target.value
                      }))}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="supportEmail"
                      type="email"
                      value={organizationSettings.supportEmail}
                      onChange={(e) => setOrganizationSettings(prev => ({
                        ...prev,
                        supportEmail: e.target.value
                      }))}
                      placeholder="support@example.com"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Deleting your organization will permanently remove all data, including chatbots, 
                  conversations, and team members. This action cannot be undone.
                </AlertDescription>
              </Alert>
              
              <Button 
                variant="destructive" 
                onClick={handleDeleteOrganization}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Organization
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your personal account settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Account settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Security settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>
                Manage your API keys and access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                API settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}