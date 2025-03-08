"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmbedCodeGeneratorProps {
  chatbotId: string;
  chatbotName: string;
  appUrl?: string;
}

export function EmbedCodeGenerator({
  chatbotId,
  chatbotName,
  appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com',
}: EmbedCodeGeneratorProps) {
  const { toast } = useToast();
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [position, setPosition] = useState('right');
  const [autoOpen, setAutoOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(`Hi there! I'm ${chatbotName}. How can I help you today?`);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Generate iframe embed code
  const iframeCode = `<iframe
  src="${appUrl}/embed/${chatbotId}?primaryColor=${encodeURIComponent(
    primaryColor
  )}&darkMode=${darkMode}&position=${position}"
  width="100%"
  height="600px"
  frameborder="0"
  allow="microphone"
></iframe>`;

  // Generate JavaScript embed code
  const jsCode = `<script>
  (function (w, d, s, o) {
    w['ChatbotWidget'] = o;
    var js = d.createElement(s);
    js.src = '${appUrl}/chat-widget.js';
    js.async = 1;
    js.dataset.chatbotId = '${chatbotId}';
    js.dataset.primaryColor = '${primaryColor}';
    js.dataset.position = '${position}';
    js.dataset.darkMode = ${darkMode};
    js.dataset.autoOpen = ${autoOpen};
    js.dataset.welcomeMessage = '${welcomeMessage.replace(/'/g, "\\'")}';
    d.getElementsByTagName('head')[0].appendChild(js);
  })(window, document, 'script', 'chatbot');
</script>`;

  // Generate link for preview
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('primaryColor', primaryColor);
    params.set('position', position);
    params.set('darkMode', darkMode.toString());
    params.set('autoOpen', autoOpen.toString());
    params.set('welcomeMessage', welcomeMessage);
    
    setPreviewUrl(`${appUrl}/embed/${chatbotId}?${params.toString()}`);
  }, [appUrl, chatbotId, primaryColor, position, darkMode, autoOpen, welcomeMessage]);

  // Handle copy to clipboard
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    
    toast({
      title: 'Copied to clipboard',
      description: 'The code has been copied to your clipboard.',
      duration: 3000,
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Embed Your Chatbot</CardTitle>
        <CardDescription>
          Generate code to embed your chatbot on your website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="javascript">
          <TabsList className="mb-4">
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="iframe">iframe</TabsTrigger>
          </TabsList>
          
          <TabsContent value="javascript" className="space-y-4">
            <div className="relative">
              <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-x-auto text-sm">
                <code>{jsCode}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(jsCode)}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add this code to your website right before the closing <code>&lt;/body&gt;</code> tag.
            </p>
          </TabsContent>
          
          <TabsContent value="iframe" className="space-y-4">
            <div className="relative">
              <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-x-auto text-sm">
                <code>{iframeCode}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleCopy(iframeCode)}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Add this iframe where you want the chatbot to appear on your page.
            </p>
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Customization</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 p-1 h-9"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={position}
                onValueChange={setPosition}
              >
                <SelectTrigger id="position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="right">Bottom Right</SelectItem>
                  <SelectItem value="left">Bottom Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Welcome Message</Label>
              <Textarea
                id="welcomeMessage"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="darkMode">Dark Mode</Label>
                <Switch
                  id="darkMode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="autoOpen">Auto-open Chat</Label>
                <Switch
                  id="autoOpen"
                  checked={autoOpen}
                  onCheckedChange={setAutoOpen}
                />
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="pt-2 flex justify-between items-center">
          <h3 className="text-lg font-medium">Preview</h3>
          <Button variant="outline" size="sm" asChild>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Preview
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}