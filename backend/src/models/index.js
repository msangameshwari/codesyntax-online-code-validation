import mongoose from 'mongoose';
const userSchema=new mongoose.Schema({name:{type:String,required:true,trim:true},email:{type:String,required:true,unique:true,lowercase:true},password:{type:String,required:true,select:false},role:{type:String,enum:['student','admin'],default:'student'},active:{type:Boolean,default:true}},{timestamps:true});
export const User=mongoose.model('User',userSchema);
const submissionSchema=new mongoose.Schema({student:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},language:String,source:String,status:{type:String,enum:['valid','invalid','unsupported']},errorCount:{type:Number,default:0},errors:[mongoose.Schema.Types.Mixed],warnings:[mongoose.Schema.Types.Mixed],processingMs:Number,engine:String},{timestamps:true});
export const Submission=mongoose.model('Submission',submissionSchema);
export const ValidationResult=mongoose.model('ValidationResult',new mongoose.Schema({submission:{type:mongoose.Schema.Types.ObjectId,ref:'Submission'},details:mongoose.Schema.Types.Mixed},{timestamps:true}));
export const NetworkLog=mongoose.model('NetworkLog',new mongoose.Schema({method:String,path:String,status:Number,durationMs:Number,failed:Boolean,createdAt:{type:Date,default:Date.now,expires:60*60*24*30}}));
export const ProjectUpload=mongoose.model('ProjectUpload',new mongoose.Schema({student:{type:mongoose.Schema.Types.ObjectId,ref:'User',index:true},name:String,report:mongoose.Schema.Types.Mixed},{timestamps:true}));
export const ProjectAnalysisReport=mongoose.model('ProjectAnalysisReport',new mongoose.Schema({project:{type:mongoose.Schema.Types.ObjectId,ref:'ProjectUpload'},report:mongoose.Schema.Types.Mixed},{timestamps:true}));
