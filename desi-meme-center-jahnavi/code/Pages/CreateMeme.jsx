import React, { useState, useEffect, useRef } from 'react';
import { MemeTemplate } from '@/entities/MemeTemplate';
import { Meme } from '@/entities/Meme';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Image as ImageIcon, Wand2, Loader2, Video, Camera, Check, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { UploadFile, InvokeLLM } from '@/integrations/Core';


// Define aesthetic text style templates
const textStyles = [
    {
        name: 'Classic',
        fontFamily: "'Impact', 'Arial Black', sans-serif",
        fillStyle: '#FFFFFF',
        strokeStyle: '#000000',
        lineWidth: 2,
    },
    {
        name: 'Cinematic',
        fontFamily: "'Cinzel', serif",
        fillStyle: '#EAEAEA',
        strokeStyle: '#111111',
        lineWidth: 3,
    },
    {
        name: 'Retro',
        fontFamily: "'Press Start 2P', cursive",
        fillStyle: '#FDF200',
        strokeStyle: '#D9005B',
        lineWidth: 2.5,
    },
    {
        name: 'Horror',
        fontFamily: "'Creepster', cursive",
        fillStyle: '#FF0000',
        strokeStyle: '#FFFFFF',
        lineWidth: 1,
    },
    {
        name: 'Elegant',
        fontFamily: "'Playfair Display', serif",
        fillStyle: '#FFFFFF',
        strokeStyle: '#333333',
        lineWidth: 1.5,
    }
];

// This is a simplified frontend-only meme generator.
// It draws text on a canvas over an image.
// Updated function to accept a style object
const generateMemeOnCanvas = (canvas, image, topText, bottomText, style) => {
    const ctx = canvas.getContext('2d');
    const { width, height } = image;
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0);

    ctx.fillStyle = style.fillStyle;
    ctx.strokeStyle = style.strokeStyle;
    const fontSize = Math.max(width / 12, 20); // Base font size
    ctx.lineWidth = Math.max((width / 150) * style.lineWidth, 2); // Scaled line width based on style and image width
    ctx.font = `bold ${fontSize}px ${style.fontFamily}`;
    ctx.textAlign = 'center';

    // Draw top text
    ctx.textBaseline = 'top';
    ctx.strokeText(topText, width / 2, height * 0.05);
    ctx.fillText(topText, width / 2, height * 0.05);

    // Draw bottom text
    ctx.textBaseline = 'bottom';
    ctx.strokeText(bottomText, width / 2, height * 0.95);
    ctx.fillText(bottomText, width / 2, height * 0.95);
};


export default function CreateMemePage() {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [topText, setTopText] = useState('');
    const [bottomText, setBottomText] = useState('');
    const [originalTopText, setOriginalTopText] = useState('');
    const [originalBottomText, setOriginalBottomText] = useState('');
    const [dialect, setDialect] = useState('');
    const [selectedTextStyle, setSelectedTextStyle] = useState(textStyles[0]); // New state for style
    const [customImage, setCustomImage] = useState(null);
    const [customVideoUrl, setCustomVideoUrl] = useState(null);
    const [uploadedVideoFile, setUploadedVideoFile] = useState(null); // Store the actual video file
    const [isGenerating, setIsGenerating] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [error, setError] = useState('');
    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUserAndTemplates = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
            } catch (e) {
                // not logged in, but can still create
            }
            const fetchedTemplates = await MemeTemplate.list();
            setTemplates(fetchedTemplates);
            if (fetchedTemplates.length > 0) {
                setSelectedTemplate(fetchedTemplates[0].imageUrl);
            }
        };
        fetchUserAndTemplates();
    }, []);

    // Function to convert text to selected dialect using AI
    const convertToDialect = async (text, selectedDialect) => {
        if (!text || !selectedDialect || selectedDialect === '') return text;
        
        setIsTranslating(true);
        try {
            const response = await InvokeLLM({
                prompt: `Convert the following text to ${selectedDialect} dialect of Telugu. If the text is in English or Hindi, first translate it to Telugu and then convert to ${selectedDialect} dialect. Keep the essence and humor intact. Only return the converted text, nothing else:

Text: "${text}"
Target Dialect: ${selectedDialect}`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        converted_text: {
                            type: "string",
                            description: "The text converted to the specified dialect"
                        }
                    }
                }
            });
            return response.converted_text || text;
        } catch (error) {
            console.error('Dialect conversion failed:', error);
            return text; // Return original text if conversion fails
        } finally {
            setIsTranslating(false);
        }
    };

    // Handle text changes and dialect conversion
    const handleTopTextChange = async (value) => {
        setOriginalTopText(value);
        if (dialect && value) {
            const converted = await convertToDialect(value, dialect);
            setTopText(converted);
        } else {
            setTopText(value);
        }
    };

    const handleBottomTextChange = async (value) => {
        setOriginalBottomText(value);
        if (dialect && value) {
            const converted = await convertToDialect(value, dialect);
            setBottomText(converted);
        } else {
            setBottomText(value);
        }
    };

    // Handle dialect change - convert existing text
    const handleDialectChange = async (selectedDialect) => {
        setDialect(selectedDialect);
        
        if (selectedDialect && originalTopText) {
            const convertedTop = await convertToDialect(originalTopText, selectedDialect);
            setTopText(convertedTop);
        } else {
            setTopText(originalTopText);
        }
        
        if (selectedDialect && originalBottomText) {
            const convertedBottom = await convertToDialect(originalBottomText, selectedDialect);
            setBottomText(convertedBottom);
        } else {
            setBottomText(originalBottomText);
        }
    };

    const handleGenerate = async () => {
        if (!dialect) {
            setError('Please select a dialect.');
            return;
        }
        if (!user) {
            setError('Please log in to create a meme.');
            return;
        }
        setError('');
        setIsGenerating(true);

        // A helper function to process and upload the meme from a canvas
        const processAndUpload = (sourceElement) => {
            const canvas = canvasRef.current;
            generateMemeOnCanvas(canvas, sourceElement, topText, bottomText, selectedTextStyle);

            canvas.toBlob(async (blob) => {
                const file = new File([blob], 'generated-meme.png', { type: 'image/png' });
                try {
                    const { file_url } = await UploadFile({ file });
                    await Meme.create({
                        generatedImageUrl: file_url,
                        dialect,
                        creatorName: user.full_name,
                        creatorProfilePicture: user.profilePicture || '',
                    });
                    navigate(createPageUrl('Home'));
                } catch (e) {
                    setError('Failed to upload the generated meme. Please try again.');
                } finally {
                    setIsGenerating(false);
                }
            }, 'image/png');
        };

        if (customVideoUrl && videoRef.current) {
            // Process from video frame
            processAndUpload(videoRef.current);
        } else {
            // Process from image
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.src = customImage || selectedTemplate;
            image.onload = () => processAndUpload(image);
            image.onerror = () => {
                setError('Could not load the image. Please try another one.');
                setIsGenerating(false);
            };
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type.startsWith('video/')) {
            setCustomImage(null);
            setSelectedTemplate(null);
            setUploadedVideoFile(file);
            setCustomVideoUrl(URL.createObjectURL(file));
        } else if (file.type.startsWith('image/')) {
            setCustomVideoUrl(null);
            setUploadedVideoFile(null);
            const reader = new FileReader();
            reader.onload = (event) => {
                setCustomImage(event.target.result);
                setSelectedTemplate(null);
            };
            reader.readAsDataURL(file);
        } else {
            setError("Unsupported file type. Please upload an image or video.");
        }
    };

    const handleCaptureFrame = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

        const frameDataUrl = canvas.toDataURL('image/png');
        setCustomImage(frameDataUrl);
        setCustomVideoUrl(null); // Switch back to image preview
    };

    // Helper for live preview text style
    const getPreviewTextStyle = () => ({
        fontFamily: selectedTextStyle.fontFamily,
        color: selectedTextStyle.fillStyle,
        WebkitTextStroke: `${Math.max(selectedTextStyle.lineWidth, 1)}px ${selectedTextStyle.strokeStyle}`,
        textShadow: `${selectedTextStyle.strokeStyle} 1px 1px 3px`,
    });

    return (
        <div className="space-y-6">
            {/* Add Google Fonts link to head for dynamic font loading */}
            <style jsx global>{`
              @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Creepster&family=Playfair+Display:wght@700&family=Press+Start+2P&display=swap');
            `}</style>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Your Meme</h2>
                <p className="text-gray-600">Choose a template, add your text, and watch the magic happen!</p>
            </div>
            
            <Card>
                <CardContent className="p-4 md:p-6">
                    <div className="grid md:grid-cols-2 gap-6 items-start">
                        {/* Left Side: Preview */}
                        <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden relative">
                             {customVideoUrl ? (
                                <div className="w-full h-full flex flex-col relative">
                                    <video
                                        ref={videoRef}
                                        src={customVideoUrl}
                                        controls
                                        className="w-full h-full object-contain"
                                    />
                                    {/* Overlay text on video preview */}
                                    <div className="absolute top-0 left-0 right-0 p-2 md:p-4 text-center pointer-events-none">
                                        <p className="font-bold text-xl md:text-3xl" style={getPreviewTextStyle()}>{topText}</p>
                                    </div>
                                    <div className="absolute bottom-12 left-0 right-0 p-2 md:p-4 text-center pointer-events-none">
                                        <p className="font-bold text-xl md:text-3xl" style={getPreviewTextStyle()}>{bottomText}</p>
                                    </div>
                                    <div className="absolute bottom-2 right-2">
                                        <Button onClick={handleCaptureFrame} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                            <Camera className="w-4 h-4 mr-1" />
                                            Capture Frame
                                        </Button>
                                    </div>
                                </div>
                             ) : (selectedTemplate || customImage) ? (
                                <>
                                    <img src={customImage || selectedTemplate} alt="Meme preview" className="w-full h-full object-contain" />
                                    <div className="absolute top-0 left-0 right-0 p-2 md:p-4 text-center">
                                        <p className="font-bold text-2xl md:text-4xl" style={getPreviewTextStyle()}>{topText}</p>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 text-center">
                                        <p className="font-bold text-2xl md:text-4xl" style={getPreviewTextStyle()}>{bottomText}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">Select template or upload media</p>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Controls */}
                        <div className="space-y-4">
                            <Tabs defaultValue="template">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="template">Use Template</TabsTrigger>
                                    <TabsTrigger value="upload">Upload Media</TabsTrigger>
                                </TabsList>
                                <TabsContent value="template" className="mt-4">
                                    <p className="text-sm text-gray-500 mb-2">Select a popular template:</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-1 max-h-[220px] overflow-y-auto rounded-lg bg-gray-50">
                                        {templates.map(t => (
                                            <div
                                                key={t.id}
                                                onClick={() => {
                                                    setSelectedTemplate(t.imageUrl);
                                                    setCustomImage(null);
                                                    setCustomVideoUrl(null);
                                                    setUploadedVideoFile(null);
                                                }}
                                                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group transition-all duration-200
                                                    ${selectedTemplate === t.imageUrl ? 'ring-4 ring-orange-500 ring-offset-2' : 'hover:scale-105'}`}
                                            >
                                                <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-end p-1.5">
                                                    <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 truncate">{t.name}</p>
                                                </div>
                                                {selectedTemplate === t.imageUrl && (
                                                    <div className="absolute top-1.5 right-1.5 bg-orange-500 text-white rounded-full p-1 shadow-lg">
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                                <TabsContent value="upload" className="mt-4">
                                     <label htmlFor="custom-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:bg-gray-50">
                                        <div className="flex gap-4">
                                          <Upload className="w-8 h-8 text-gray-400"/>
                                          <Video className="w-8 h-8 text-gray-400"/>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">Upload Image or Video</p>
                                        <p className="text-xs text-gray-400">Images: PNG, JPG | Videos: MP4, MOV</p>
                                        <Input id="custom-upload" type="file" className="hidden" accept="image/*,video/mp4,video/quicktime,video/webm" onChange={handleFileChange} />
                                    </label>
                                </TabsContent>
                            </Tabs>

                            <div className="relative">
                                <Textarea 
                                    placeholder="Top Text (పై వచనం)" 
                                    value={originalTopText} 
                                    onChange={e => handleTopTextChange(e.target.value)} 
                                    rows={2} 
                                    className="text-lg text-center" 
                                />
                                {isTranslating && (
                                    <div className="absolute top-2 right-2">
                                        <Sparkles className="w-4 h-4 animate-spin text-orange-500" />
                                    </div>
                                )}
                                {topText !== originalTopText && (
                                    <p className="text-xs text-green-600 mt-1">✨ Converted to {dialect} dialect: "{topText}"</p>
                                )}
                            </div>

                            <div className="relative">
                                <Textarea 
                                    placeholder="Bottom Text (కింది వచనం)" 
                                    value={originalBottomText} 
                                    onChange={e => handleBottomTextChange(e.target.value)} 
                                    rows={2} 
                                    className="text-lg text-center" 
                                />
                                {isTranslating && (
                                    <div className="absolute top-2 right-2">
                                        <Sparkles className="w-4 h-4 animate-spin text-orange-500" />
                                    </div>
                                )}
                                {bottomText !== originalBottomText && (
                                    <p className="text-xs text-green-600 mt-1">✨ Converted to {dialect} dialect: "{bottomText}"</p>
                                )}
                            </div>

                            {/* Text Style Selector */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Text Style</label>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {textStyles.map(style => (
                                        <Button
                                            key={style.name}
                                            variant="outline"
                                            onClick={() => setSelectedTextStyle(style)}
                                            className={`flex-shrink-0 transition-all duration-200 ${selectedTextStyle.name === style.name ? 'ring-2 ring-orange-500' : ''}`}
                                            style={{
                                                fontFamily: style.fontFamily,
                                                color: style.fillStyle,
                                                backgroundColor: style.strokeStyle,
                                                border: `2px solid ${style.strokeStyle}`,
                                                textShadow: `1px 1px 2px black` // Added for better visibility on button
                                            }}
                                        >
                                            {style.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                             <Select onValueChange={handleDialectChange} value={dialect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Dialect (మాండలికాన్ని ఎంచుకోండి)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Vizag">Vizag</SelectItem>
                                    <SelectItem value="Nellore">Nellore</SelectItem>
                                    <SelectItem value="Karimnagar">Karimnagar</SelectItem>
                                    <SelectItem value="Rayalaseema">Rayalaseema</SelectItem>
                                    <SelectItem value="Telangana">Telangana</SelectItem>
                                    <SelectItem value="Godavari">Godavari</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>

                            {dialect && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <p className="text-sm text-blue-700 flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        Your text will be automatically converted to {dialect} dialect!
                                    </p>
                                </div>
                            )}

                            {error && <p className="text-sm text-red-500">{error}</p>}

                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating || (!selectedTemplate && !customImage && !customVideoUrl)}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-lg py-6"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-6 h-6 mr-2" />
                                        Generate Meme
                                        {customVideoUrl && " from Current Frame"}
                                    </>
                                )}
                            </Button>

                            {customVideoUrl && (
                                <p className="text-xs text-gray-600 text-center">
                                    ✨ You can play the video to any frame and click "Generate Meme" to use that moment!
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}