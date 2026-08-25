<?php
declare(strict_types=1);
final class LocalPrivateStorage
{
 private string$root;
 /** @param list<string> $allowedMime */
 public function __construct(string$root,private readonly array$allowedMime,private readonly int$maxBytes,?string$webRoot)
 {
  if($root===''||$root[0]!=='/'||is_link($root)||!is_dir($root)||!is_writable($root))throw new RuntimeException('Private storage root is unavailable.');$real=realpath($root);if($real===false)throw new RuntimeException('Private storage root cannot be resolved.');$permissions=fileperms($real);if($permissions===false||($permissions&0077)!==0)throw new RuntimeException('Private storage root permissions are too broad.');if($webRoot!==null&&($web=realpath($webRoot))!==false&&($real===$web||str_starts_with($real,$web.'/')))throw new RuntimeException('Private storage must be outside web root.');$this->root=rtrim($real,'/');
 }
 /** @return array{key:string,stored_filename:string,mime:string,bytes:int,sha256:string,path:string} */
 public function store(string$tmp,string$original):array
 {
  if(!is_file($tmp)||is_link($tmp))throw new DomainException('Upload is unavailable.');
  $safeOriginal=basename(str_replace('\\','/',$original));
  if($safeOriginal===''||strlen($safeOriginal)>255||preg_match('/[\x00-\x1F\x7F]/',$safeOriginal)===1
    ||preg_match('/(?:^|\.)(?:php[0-9]?|phtml|phar|html?|shtml|js|mjs|cjs|svg)(?:\.|$)/i',$safeOriginal)===1){
   throw new DomainException('File name is not allowed.');
  }
  $bytes=filesize($tmp);if($bytes===false||$bytes<1||$bytes>$this->maxBytes)throw new DomainException('File size is not allowed.');$mime=(new finfo(FILEINFO_MIME_TYPE))->file($tmp);if(!is_string($mime)||!in_array($mime,$this->allowedMime,true))throw new DomainException('File type is not allowed.');$ext=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','application/pdf'=>'pdf'][$mime]??'bin';$random=bin2hex(random_bytes(24));$key='case-attachments/'.substr($random,0,2).'/'.substr($random,2,2).'/'.$random.'.'.$ext;$target=$this->root.'/'.$key;$dir=dirname($target);if(!is_dir($dir)&&!mkdir($dir,0700,true)&&!is_dir($dir))throw new RuntimeException('Storage directory cannot be created.');$realDir=realpath($dir);if($realDir===false||is_link($dir)||!str_starts_with($realDir,$this->root.'/'))throw new RuntimeException('Storage directory is unsafe.');$stage=tempnam($realDir,'.upload-');if($stage===false)throw new RuntimeException('Storage staging file cannot be created.');chmod($stage,0600);$in=fopen($tmp,'rb');$out=fopen($stage,'wb');if($in===false||$out===false){@unlink($stage);throw new RuntimeException('File could not be staged.');}try{$copied=stream_copy_to_stream($in,$out,$this->maxBytes+1);}finally{fclose($in);fclose($out);}if($copied!==$bytes||$copied>$this->maxBytes||!rename($stage,$target)){@unlink($stage);throw new RuntimeException('File could not be stored.');}@unlink($tmp);chmod($target,0600);return['key'=>$key,'stored_filename'=>basename($target),'mime'=>$mime,'bytes'=>(int)$bytes,'sha256'=>hash_file('sha256',$target),'path'=>$target];
 }
 public function resolve(string$key):string
 {
  if(!preg_match('#^case-attachments/[a-f0-9]{2}/[a-f0-9]{2}/[a-f0-9]{48}\.(?:jpg|png|webp|pdf)$#',$key))throw new DomainException('Attachment is unavailable.');$path=realpath($this->root.'/'.$key);if($path===false||!is_file($path)||is_link($path)||!str_starts_with($path,$this->root.'/'))throw new DomainException('Attachment is unavailable.');return$path;
 }
 public function output(string$key):void{$path=$this->resolve($key);$handle=fopen($path,'rb');if($handle===false)throw new RuntimeException('Attachment cannot be opened.');try{fpassthru($handle);}finally{fclose($handle);}}
 public function remove(string$key):void{try{$path=$this->resolve($key);if(!unlink($path))throw new RuntimeException('Stored file cleanup failed.');}catch(DomainException){}}
}
